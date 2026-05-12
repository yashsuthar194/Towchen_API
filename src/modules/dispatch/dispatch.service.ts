import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { MapsService } from 'src/services/maps/maps.service';
import { AvailabilityStatus, LocationCategory, driver, location } from '@prisma/client';
import { Utility } from 'src/shared/helper/utility';
import { ServiceArrivalEstimateDto } from '../location/dto/order-estimate-response.dto';

/** Maximum number of driver locations sent to the Distance Matrix API in one batch. */
const PROXIMITY_PRE_FILTER_LIMIT = 10;

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsService: MapsService,
  ) {}

  /**
   * Finds the arrival estimate (distance and time) for the nearest available driver
   * providing a specific service.
   *
   * @param serviceId - The ID of the service to find drivers for
   * @param destinationLat - Latitude of the breakdown point
   * @param destinationLng - Longitude of the breakdown point
   * @returns Estimate details or null if no available driver is found
   */
  async getNearestServiceArrivalEstimate(
    serviceId: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<ServiceArrivalEstimateDto | null> {
    const drivers = await this.getAvailableDriversByServiceId(serviceId);
    if (drivers.length === 0) return null;

    return this.calculateArrivalEstimateForDrivers(drivers, destinationLat, destinationLng);
  }

  /**
   * Fetches all available drivers (with a registered start location) for a specific service.
   */
  async getAvailableDriversByServiceId(serviceId: number) {
    return this.prisma.driver.findMany({
      where: {
        is_deleted: false,
        availability_status: AvailabilityStatus.Available,
        vendor: {
          service_ids: { has: serviceId },
        },
        startLocation: {
          is: {
            category: LocationCategory.Driver,
          },
        },
      },
      include: {
        startLocation: true,
      },
    });
  }

  /**
   * Fetches all available drivers grouped by multiple service IDs.
   * Optimized for batch processing of estimates.
   */
  async getAvailableDriversByServiceIds(serviceIds: number[]) {
    const drivers = await this.prisma.driver.findMany({
      where: {
        is_deleted: false,
        availability_status: AvailabilityStatus.Available,
        vendor: {
          service_ids: { hasSome: serviceIds },
        },
        startLocation: {
          is: {
            category: LocationCategory.Driver,
          },
        },
      },
      include: {
        startLocation: true,
        vendor: { select: { service_ids: true } },
      },
    });

    const driversByService = new Map<number, (driver & { startLocation: location | null })[]>();

    for (const driver of drivers) {
      for (const serviceId of driver.vendor.service_ids) {
        if (!serviceIds.includes(serviceId)) continue;
        const list = driversByService.get(serviceId) ?? [];
        list.push(driver);
        driversByService.set(serviceId, list);
      }
    }

    return driversByService;
  }

  /**
   * Core logic to find the best ETA from a list of candidate drivers using a two-phase filter:
   * Phase 1: Haversine distance (fast, in-process)
   * Phase 2: Google Distance Matrix (accurate, road-aware)
   */
  async calculateArrivalEstimateForDrivers(
    drivers: (driver & { startLocation: location | null })[],
    destLat: number,
    destLng: number,
  ): Promise<ServiceArrivalEstimateDto | null> {
    // Phase 1: Pre-filter using straight-line distance
    const candidates = drivers
      .filter((d) => d.startLocation)
      .map((d) => ({
        driver: d,
        linearDistance: Utility.calculateHaversineDistanceKm(
          d.startLocation!.latitude,
          d.startLocation!.longitude,
          destLat,
          destLng,
        ),
      }))
      .sort((a, b) => a.linearDistance - b.linearDistance)
      .slice(0, PROXIMITY_PRE_FILTER_LIMIT);

    if (candidates.length === 0) return null;

    // Phase 2: Batch road distance/time lookup
    const origins = candidates.map((c) => ({
      lat: c.driver.startLocation!.latitude,
      lng: c.driver.startLocation!.longitude,
    }));

    const matrixResults = await this.mapsService.getDistanceMatrixByCoordinatesAsync(
      origins,
      destLat,
      destLng,
    );

    let bestResult: ServiceArrivalEstimateDto | null = null;
    let minSeconds = Infinity;

    for (const result of matrixResults) {
      if (result.status !== 'OK' || !result.travel_time || !result.distance) continue;

      const seconds = result.traffic_aware_duration?.raw_value ?? result.travel_time.raw_value;
      if (seconds < minSeconds) {
        minSeconds = seconds;
        bestResult = {
          distance: result.distance,
          eta: result.travel_time,
          traffic_aware_eta: result.traffic_aware_duration ?? undefined,
        };
      }
    }

    return bestResult;
  }
}
