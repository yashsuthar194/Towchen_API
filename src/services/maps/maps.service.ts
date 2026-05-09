import { Injectable, Inject } from '@nestjs/common';
import { IMapsService } from './interfaces/maps.interface';
import { AddressPredictionDto } from './types/address-prediction.dto';
import { LocationResponseDto } from 'src/modules/location/dto/location-response.dto';
import { DistanceMatrixResultDto } from './types/distance-matrix-result.dto';

/**
 * Main Maps service that acts as a facade/context for the Strategy pattern.
 * Delegates all map operations to the configured provider.
 *
 * @remarks
 * Two-step address flow:
 *  1. `searchPredictionsAsync` → lightweight list of predictions for the user to pick from
 *  2. `resolveAddressByPlaceIdAsync` → full address object for the selected prediction
 *
 * Switching providers (Google Maps → Mapbox → HERE etc.) requires only changing maps.module.ts.
 *
 * @example
 * ```typescript
 * constructor(private readonly mapsService: MapsService) {}
 *
 * // Step 1: search
 * const predictions = await this.mapsService.searchPredictionsAsync('Sector 1');
 *
 * // Step 2: resolve after user picks
 * const address = await this.mapsService.resolveAddressByPlaceIdAsync(predictions[0].place_id);
 * ```
 */
@Injectable()
export class MapsService implements IMapsService {
  constructor(
    @Inject('MAPS_PROVIDER')
    private readonly mapsProvider: IMapsService,
  ) { }

  /**
   * {@inheritDoc IMapsService.searchPredictionsAsync}
   */
  async searchPredictionsAsync(input: string): Promise<AddressPredictionDto[]> {
    return this.mapsProvider.searchPredictionsAsync(input);
  }

  /**
   * {@inheritDoc IMapsService.resolveAddressByPlaceIdAsync}
   */
  async resolveAddressByPlaceIdAsync(placeId: string): Promise<LocationResponseDto> {
    return this.mapsProvider.resolveAddressByPlaceIdAsync(placeId);
  }

  /**
   * {@inheritDoc IMapsService.getDistanceMatrixAsync}
   */
  async getDistanceMatrixAsync(
    originPlaceId: string,
    destinationPlaceId: string,
  ): Promise<DistanceMatrixResultDto> {
    return this.mapsProvider.getDistanceMatrixAsync(originPlaceId, destinationPlaceId);
  }
}
