import { Injectable } from '@nestjs/common';
import { MapsService } from 'src/services/maps/maps.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AddressPredictionDto } from 'src/services/maps/types/address-prediction.dto';
import { AutocompleteAddressDto } from './dto/autocomplete-address.dto';
import { ResolveAddressDto } from './dto/resolve-address.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { OrderEstimateBodyDto } from './dto/order-estimate-body.dto';
import { OrderEstimateResponseDto, PricedSubServiceDto } from './dto/order-estimate-response.dto';

@Injectable()
export class LocationService {
  constructor(
    private readonly mapsService: MapsService,
    private readonly _prisma: PrismaService,
  ) { }

  /**
   * Step 1: Returns a list of address predictions for the user to choose from.
   * Lightweight — no full address parsing, just prediction text and place_id.
   */
  async searchPredictionsAsync(dto: AutocompleteAddressDto): Promise<AddressPredictionDto[]> {
    return await this.mapsService.searchPredictionsAsync(dto.input);
  }

  /**
   * Step 2: Resolves the user's selected place_id into a full formatted address object.
   * The returned object matches the DB schema and can be directly passed to the order API.
   */
  async resolveAddressAsync(dto: ResolveAddressDto): Promise<LocationResponseDto> {
    return await this.mapsService.resolveAddressByPlaceIdAsync(dto.place_id);
  }

  /**
   * Order estimate: resolves both place_ids, calculates real road distance via Google
   * Distance Matrix API, then returns ALL active sub_services with their pricing
   * calculated for this specific journey.
   *
   * @remarks
   * Pricing formula per sub-service:
   *   extraKm       = max(0, actual_km - fix_distance)
   *   extra_charge  = extraKm × extra_price
   *   total_price   = fix_price + extra_charge
   *
   * Both place_ids are resolved in parallel to minimize latency.
   * All sub_services (across all services) are returned — not limited to a specific service.
   */
  async getOrderEstimateAsync(dto: OrderEstimateBodyDto): Promise<OrderEstimateResponseDto> {
    // 1. Resolve both locations + fetch distance matrix — all in parallel
    const [breakdownLocation, dropoffLocation, distanceResult] = await Promise.all([
      this.mapsService.resolveAddressByPlaceIdAsync(dto.breakdown_place_id),
      this.mapsService.resolveAddressByPlaceIdAsync(dto.dropoff_place_id),
      this.mapsService.getDistanceMatrixAsync(dto.breakdown_place_id, dto.dropoff_place_id),
    ]);

    // 2. Fetch ALL active sub_services (no service filter — covers all services)
    const subServices = await this._prisma.sub_service.findMany({
      where: { is_active: true },
      orderBy: [{ service_id: 'asc' }, { name: 'asc' }],
    });

    // 3. Actual road distance in km (raw_value is in metres)
    const actualKm = distanceResult.distance.raw_value / 1000;

    // 4. Calculate pricing for each sub-service
    const pricedSubServices: PricedSubServiceDto[] = subServices.map((ss) => {
      const extraKm = Math.max(0, actualKm - ss.fix_distance);
      const extraCharge = parseFloat((extraKm * ss.extra_price).toFixed(2));
      const totalPrice = parseFloat((ss.fix_price + extraCharge).toFixed(2));

      return {
        id: ss.id,
        name: ss.name,
        ton: ss.ton,
        fix_distance: ss.fix_distance,

        // Formatted strings (human-readable)
        fix_price_formatted: `₹${ss.fix_price}`,
        extra_price_per_km_formatted: `₹${ss.extra_price}/km`,
        calculated_distance_formatted: `${actualKm.toFixed(2)} km`,
        extra_charge_formatted: `₹${extraCharge}`,
        total_price_formatted: `₹${totalPrice}`,

        // Raw numeric values (for programmatic use)
        fix_price: ss.fix_price,
        extra_price_per_km: ss.extra_price,
        calculated_distance_km: parseFloat(actualKm.toFixed(2)),
        extra_charge: extraCharge,
        total_price: totalPrice,
      };
    });

    return {
      breakdown_location: breakdownLocation,
      dropoff_location: dropoffLocation,
      distance: distanceResult.distance,
      travel_time: distanceResult.travel_time,
      traffic_aware_duration: distanceResult.traffic_aware_duration,
      sub_services: pricedSubServices,
    };
  }
}
