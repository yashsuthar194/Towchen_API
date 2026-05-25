import { Injectable } from '@nestjs/common';
import { MapsService } from 'src/services/maps/maps.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AddressPredictionDto } from 'src/services/maps/types/address-prediction.dto';
import { AutocompleteAddressDto } from './dto/autocomplete-address.dto';
import { ResolveAddressDto } from './dto/resolve-address.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { OrderEstimateBodyDto } from './dto/order-estimate-body.dto';
import {
  OrderEstimateResponseDto,
  PricedSubServiceDto,
  ServiceArrivalEstimateDto,
} from './dto/order-estimate-response.dto';
import { sub_service } from '@prisma/client';
import { DispatchService } from '../dispatch/dispatch.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly mapsService: MapsService,
    private readonly prisma: PrismaService,
    private readonly dispatchService: DispatchService,
  ) {}

  /**
   * Step 1: Returns a list of address predictions for the user to choose from.
   */
  async searchPredictionsAsync(dto: AutocompleteAddressDto): Promise<AddressPredictionDto[]> {
    return await this.mapsService.searchPredictionsAsync(dto.input);
  }

  /**
   * Step 2: Resolves the user's selected place_id into a full formatted address object.
   */
  async resolveAddressAsync(dto: ResolveAddressDto): Promise<LocationResponseDto> {
    return await this.mapsService.resolveAddressByPlaceIdAsync(dto.place_id);
  }

  /**
   * Main entry point for getting an order estimate.
   * Broken down into discrete steps for clarity and maintainability.
   */
  async getOrderEstimateAsync(dto: OrderEstimateBodyDto): Promise<OrderEstimateResponseDto> {
    // Step 1: Resolve geographic coordinates and breakdown-to-dropoff distance
    const { breakdownLocation, dropoffLocation, travelMetrics } =
      await this.resolveRouteMetricsAsync(dto);

    // Step 2: Fetch all sub-services available for pricing
    const subServices = await this.getActiveSubServicesAsync();

    // Step 3: Get arrival time estimates for the nearest providers per service
    const serviceArrivalEstimates = await this.calculateServiceArrivalEstimatesAsync(
      subServices,
      breakdownLocation.latitude,
      breakdownLocation.longitude,
    );

    // Step 4: Combine metrics, pricing, and arrival estimates into the final result
    const pricedSubServices = this.mapToPricedSubServices(
      subServices,
      travelMetrics.distance.raw_value,
      serviceArrivalEstimates,
    );

    return {
      breakdown_location: breakdownLocation,
      dropoff_location: dropoffLocation,
      distance: travelMetrics.distance,
      travel_time: travelMetrics.travel_time,
      traffic_aware_duration: travelMetrics.traffic_aware_duration,
      sub_services: pricedSubServices,
    };
  }

  /**
   * Step 1 Logic: Resolves breakdown/dropoff place_ids and gets road distance matrix.
   */
  private async resolveRouteMetricsAsync(dto: OrderEstimateBodyDto) {
    const breakdownLocation = await this.mapsService.resolveAddressByPlaceIdAsync(dto.breakdown_place_id);
    let dropoffLocation: LocationResponseDto | null = null;
    let travelMetrics: any = {
      distance: { text: '0 km', raw_value: 0 },
      travel_time: { text: '0 mins', raw_value: 0 },
      traffic_aware_duration: { text: '0 mins', raw_value: 0 },
    };

    if (dto.dropoff_place_id) {
      const [dropLoc, metrics] = await Promise.all([
        this.mapsService.resolveAddressByPlaceIdAsync(dto.dropoff_place_id),
        this.mapsService.getDistanceMatrixAsync(dto.breakdown_place_id, dto.dropoff_place_id),
      ]);
      dropoffLocation = dropLoc;
      travelMetrics = metrics;
    }

    return { breakdownLocation, dropoffLocation, travelMetrics };
  }

  /**
   * Step 2 Logic: Retrieves all active sub-services from the database.
   */
  private async getActiveSubServicesAsync(): Promise<any[]> {
    return this.prisma.sub_service.findMany({
      where: { is_active: true },
      include: {
        conditions: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Step 3 Logic: Batch calculates the arrival estimate from the nearest provider for every unique service.
   */
  private async calculateServiceArrivalEstimatesAsync(
    subServices: any[],
    breakdownLat: number,
    breakdownLng: number,
  ): Promise<Map<number, ServiceArrivalEstimateDto | null>> {
    const serviceIds = [...new Set(subServices.map((ss) => ss.service_id))];
    const availableDriversByService = await this.dispatchService.getAvailableDriversByServiceIds(serviceIds);

    const arrivalEstimates = new Map<number, ServiceArrivalEstimateDto | null>();

    // Execute proximity calculations for all services in parallel
    const estimateResults = await Promise.all(
      serviceIds.map(async (serviceId) => {
        const drivers = availableDriversByService.get(serviceId) ?? [];
        const estimate = await this.dispatchService.calculateArrivalEstimateForDrivers(
          drivers,
          breakdownLat,
          breakdownLng,
        );
        return { serviceId, estimate };
      }),
    );

    // Populate the map with results
    estimateResults.forEach(({ serviceId, estimate }) => {
      arrivalEstimates.set(serviceId, estimate);
    });

    return arrivalEstimates;
  }

  /**
   * Step 4 Logic: Calculates pricing for each sub-service and links the arrival estimates.
   */
  private mapToPricedSubServices(
    subServices: any[],
    actualDistanceMetres: number,
    arrivalEstimates: Map<number, ServiceArrivalEstimateDto | null>,
  ): PricedSubServiceDto[] {
    return subServices.map((ss) => {
      const isThreeWay = ss.journey_type === 'ThreeWay';
      const distanceMetres = isThreeWay ? 0 : actualDistanceMetres;
      const km = distanceMetres / 1000;

      const extraKm = Math.max(0, km - ss.fix_distance);
      const extraCharge = parseFloat((extraKm * ss.extra_price).toFixed(2));
      const totalPrice = parseFloat((ss.fix_price + extraCharge).toFixed(2));

      // GST tax calculations
      const cgst = parseFloat((totalPrice * 0.09).toFixed(2));
      const sgst = parseFloat((totalPrice * 0.09).toFixed(2));
      const otherTax = parseFloat((totalPrice * 0.00).toFixed(2));
      const grandTotal = parseFloat((totalPrice + cgst + sgst + otherTax).toFixed(2));

      return {
        id: ss.id,
        name: ss.name,
        ton: ss.ton,
        fix_distance: ss.fix_distance,

        // Human-readable formatted values
        fix_price_formatted: `₹${ss.fix_price}`,
        extra_price_per_km_formatted: `₹${ss.extra_price}/km`,
        calculated_distance_formatted: `${km.toFixed(2)} km`,
        extra_charge_formatted: `₹${extraCharge}`,
        total_price_formatted: `₹${totalPrice}`,
        cgst_formatted: `₹${cgst.toFixed(2)}`,
        sgst_formatted: `₹${sgst.toFixed(2)}`,
        other_tax_formatted: `₹${otherTax.toFixed(2)}`,
        grand_total_formatted: `₹${grandTotal.toFixed(2)}`,

        // Raw numeric values
        fix_price: ss.fix_price,
        extra_price_per_km: ss.extra_price,
        calculated_distance_km: parseFloat(km.toFixed(2)),
        extra_charge: extraCharge,
        total_price: totalPrice,
        cgst_rate: 9,
        sgst_rate: 9,
        other_tax_rate: 0,
        cgst,
        sgst,
        other_tax: otherTax,
        grand_total: grandTotal,

        // Arrival estimate (time/distance from nearest provider)
        arrival_estimate: arrivalEstimates.get(ss.service_id) ?? null,

        // New fields mapped to DTO output
        image_url: ss.image_url,
        journey_type: ss.journey_type,
        conditions: ss.conditions || [],
      };
    });
  }
}
