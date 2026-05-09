import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Client, AddressComponent, TrafficModel } from '@googlemaps/google-maps-services-js';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { IMapsService } from '../interfaces/maps.interface';
import { AddressPredictionDto } from '../types/address-prediction.dto';
import { LocationResponseDto } from 'src/modules/location/dto/location-response.dto';
import { DistanceMatrixResultDto } from '../types/distance-matrix-result.dto';

/**
 * Google Maps implementation of IMapsService.
 *
 * @remarks
 * Uses the Google Places API for autocomplete (Step 1) and place details (Step 2).
 * API keys are sourced from TypedConfigService (GOOGLE_MAPS_API_KEYS in .env).
 *
 * Environment variables required:
 * - GOOGLE_MAPS_API_KEYS="KEY"                      (single key for both APIs)
 * - GOOGLE_MAPS_API_KEYS="PLACES_KEY,GEOCODE_KEY"  (separate keys)
 */
@Injectable()
export class GoogleMapsService implements IMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly client: Client;
  private readonly placesApiKey: string;
  private readonly geocodeApiKey: string;

  constructor(private readonly configService: TypedConfigService) {
    this.client = new Client({});
    this.placesApiKey = this.configService.maps.placesApiKey;
    this.geocodeApiKey = this.configService.maps.geocodeApiKey;
    this.logger.log('Google Maps service initialized');
  }

  /**
   * {@inheritDoc IMapsService.searchPredictionsAsync}
   *
   * @remarks
   * Calls Google Places Autocomplete API. Results are restricted to India.
   */
  async searchPredictionsAsync(input: string): Promise<AddressPredictionDto[]> {
    try {
      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: this.placesApiKey,
          components: ['country:in'],
        },
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        const errorMsg = response.data.error_message || response.data.status;
        throw new Error(`Google Maps API error: ${errorMsg}`);
      }

      return (response.data.predictions || []).map((p) => ({
        place_id: p.place_id,
        description: p.description,
        main_text: p.structured_formatting?.main_text || '',
        secondary_text: p.structured_formatting?.secondary_text || '',
        types: p.types || [],
      }));
    } catch (error) {
      const errorMsg = error.response?.data?.error_message || error.message || 'Failed to fetch address predictions';
      this.logger.error(`Error fetching predictions for "${input}": ${errorMsg}`);
      throw new InternalServerErrorException(errorMsg);
    }
  }

  /**
   * {@inheritDoc IMapsService.resolveAddressByPlaceIdAsync}
   *
   * @remarks
   * Calls Google Place Details API and parses the result into the flat DB schema.
   */
  async resolveAddressByPlaceIdAsync(placeId: string): Promise<LocationResponseDto> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.placesApiKey,
          fields: ['address_components', 'geometry', 'formatted_address', 'name'],
        },
      });

      if (response.data.status !== 'OK') {
        const errorMsg = response.data.error_message || response.data.status;
        throw new Error(`Google Maps API error: ${errorMsg}`);
      }

      const result = response.data.result;
      return this.parseAddressComponents(
        placeId,
        result.address_components || [],
        result.formatted_address,
        result.geometry?.location?.lat || 0,
        result.geometry?.location?.lng || 0,
        result.name,
      );
    } catch (error) {
      const errorMsg = error.response?.data?.error_message || error.message || 'Failed to resolve address details';
      this.logger.error(`Error resolving place_id "${placeId}": ${errorMsg}`);
      throw new InternalServerErrorException(errorMsg);
    }
  }

  /**
   * {@inheritDoc IMapsService.getDistanceMatrixAsync}
   *
   * @remarks
   * Uses the `place_id:` prefix in origins/destinations to avoid a separate geocoding call.
   * Sets `departure_time: 'now'` to unlock traffic-aware duration.
   * `duration_in_traffic` may be absent on basic API keys (returns undefined gracefully).
   */
  async getDistanceMatrixAsync(
    originPlaceId: string,
    destinationPlaceId: string,
  ): Promise<DistanceMatrixResultDto> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [`place_id:${originPlaceId}`],
          destinations: [`place_id:${destinationPlaceId}`],
          key: this.geocodeApiKey,
          departure_time: Date.now(),
          traffic_model: TrafficModel.best_guess,
        },
      });

      const status = response.data.status;
      if (status !== 'OK') {
        const errorMsg = response.data.error_message || status;
        throw new Error(`Google Distance Matrix API error: ${errorMsg}`);
      }

      const element = response.data.rows?.[0]?.elements?.[0];

      if (!element || element.status !== 'OK') {
        const elementStatus = element?.status || 'NO_RESULT';
        throw new Error(`Distance Matrix element error: ${elementStatus}. Check that both place_ids are valid and routable.`);
      }

      const result: DistanceMatrixResultDto = {
        distance: {
          raw_value: element.distance.value,
          formatted: element.distance.text,
        },
        travel_time: {
          raw_value: element.duration.value,
          formatted: element.duration.text,
        },
      };

      // traffic_aware_duration is only present with a premium API key
      if (element.duration_in_traffic) {
        result.traffic_aware_duration = {
          raw_value: element.duration_in_traffic.value,
          formatted: element.duration_in_traffic.text,
        };
      }

      return result;
    } catch (error) {
      const errorMsg = error.response?.data?.error_message || error.message || 'Failed to calculate distance';
      this.logger.error(
        `Error calculating distance from "${originPlaceId}" to "${destinationPlaceId}": ${errorMsg}`,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  /**
   * Parses Google's complex address_components array into the project's flat LocationResponseDto.
   */
  private parseAddressComponents(
    placeId: string,
    components: AddressComponent[],
    formattedAddress?: string,
    lat?: number,
    lng?: number,
    landmarkName?: string,
  ): LocationResponseDto {
    const location: LocationResponseDto = {
      place_id: placeId,
      address: formattedAddress,
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      latitude: lat || 0,
      longitude: lng || 0,
      landmark: landmarkName,
    };

    let streetNumber = '';
    let route = '';

    for (const component of components) {
      const types = component.types as string[];

      if (types.includes('street_number')) streetNumber = component.long_name;
      if (types.includes('route')) route = component.long_name;
      if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        if (!location.area) location.area = component.long_name;
      }
      if (types.includes('locality') || types.includes('administrative_area_level_3')) {
        location.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) location.state = component.long_name;
      if (types.includes('country')) location.country = component.long_name;
      if (types.includes('postal_code')) location.pincode = component.long_name;
    }

    if (streetNumber && route) {
      location.street = `${streetNumber} ${route}`;
    } else {
      location.street = route || streetNumber;
    }

    // Clear landmark if it is just the full formatted address
    if (location.landmark && location.landmark.includes(formattedAddress || '')) {
      location.landmark = undefined;
    }

    return location;
  }
}
