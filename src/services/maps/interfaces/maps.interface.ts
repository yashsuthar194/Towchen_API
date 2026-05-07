import { AddressPredictionDto } from '../types/address-prediction.dto';
import { LocationResponseDto } from 'src/modules/location/dto/location-response.dto';

/**
 * Interface defining the contract for all Maps service providers.
 * Implements the Strategy pattern to allow switching between different
 * map providers (Google Maps, Mapbox, HERE Maps, etc.)
 *
 * @remarks
 * Two-step address flow:
 *  1. Call `searchPredictionsAsync` with user input → display dropdown list
 *  2. Call `resolveAddressByPlaceIdAsync` with selected `place_id` → get full address
 */
export interface IMapsService {
  /**
   * Step 1: Returns a list of address predictions based on user input text.
   * Results are lightweight (place_id + display text only) intended for a dropdown list.
   * The frontend displays these and the user picks one.
   *
   * @param input - User input text (address, street, area, landmark, city, pincode)
   * @returns Promise resolving to an array of predictions
   *
   * @example
   * ```typescript
   * const predictions = await mapsService.searchPredictionsAsync('Sector 1 Gandhinagar');
   * // Returns: [{ place_id: 'ChIJ...', description: 'Sector 1, Gandhinagar, Gujarat, India', ... }]
   * ```
   */
  searchPredictionsAsync(input: string): Promise<AddressPredictionDto[]>;

  /**
   * Step 2: Resolves a selected place_id into a full formatted address object.
   * Called when the user selects a prediction from the dropdown.
   *
   * @param placeId - The unique place identifier (from `searchPredictionsAsync` results)
   * @returns Promise resolving to a full formatted address matching the DB schema
   *
   * @example
   * ```typescript
   * const address = await mapsService.resolveAddressByPlaceIdAsync('ChIJN1t_tDeuEmsRUsoyG83frY4');
   * // Returns: { address, street, area, city, state, pincode, country, latitude, longitude, landmark }
   * ```
   */
  resolveAddressByPlaceIdAsync(placeId: string): Promise<LocationResponseDto>;
}
