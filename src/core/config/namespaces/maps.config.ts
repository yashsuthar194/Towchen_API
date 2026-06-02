import { IsNotEmpty, IsString } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

/**
 * Configuration for Google Maps API integration.
 *
 * @remarks
 * Set GOOGLE_MAPS_API_KEYS in your .env file.
 * - Single key:  GOOGLE_MAPS_API_KEYS="KEY_A"
 * - Separate keys: GOOGLE_MAPS_API_KEYS="PLACES_KEY,GEOCODE_KEY"
 *   → KEY_A will be used for both Places and Geocoding APIs.
 *   → PLACES_KEY for Places API, GEOCODE_KEY for Geocoding API.
 */
@ConfigNamespace('maps')
export class MapsConfig {
  @IsString({ message: 'GOOGLE_MAPS_API_KEYS must be a string' })
  @IsNotEmpty({ message: 'GOOGLE_MAPS_API_KEYS is required. Set it in .env as a single key or comma-separated "PLACES_KEY,GEOCODE_KEY"' })
  GOOGLE_MAPS_API_KEYS: string;

  /**
   * Returns the key for Google Places API (first in the comma-separated list).
   */
  get placesApiKey(): string {
    return this.GOOGLE_MAPS_API_KEYS.split(',')[0].trim();
  }

  /**
   * Returns the key for Google Geocoding API.
   * Falls back to the Places API key if only one key is provided.
   */
  get geocodeApiKey(): string {
    const keys = this.GOOGLE_MAPS_API_KEYS.split(',').map((k) => k.trim());
    return keys.length > 1 ? keys[1] : keys[0];
  }
}

export const mapsConfig = createConfigLoader(MapsConfig);
