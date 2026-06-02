import { AddressPredictionDto } from '../types/address-prediction.dto';
import { LocationResponseDto } from 'src/modules/location/dto/location-response.dto';
import { DistanceMatrixResultDto } from '../types/distance-matrix-result.dto';
import { CoordinateDistanceResultDto } from 'src/services/maps/types/coordinate-distance-result.dto';

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

  /**
   * Calculates real road distance, travel time, and traffic-aware duration between two places.
   *
   * @param originPlaceId - Google Maps place_id for the origin (e.g. breakdown location)
   * @param destinationPlaceId - Google Maps place_id for the destination (e.g. dropoff location)
   * @returns Promise resolving to distance, travel_time and traffic_aware_duration
   *
   * @example
   * ```typescript
   * const result = await mapsService.getDistanceMatrixAsync('ChIJ...origin', 'ChIJ...dest');
   * // Returns: { distance: { raw_value: 15200, formatted: '15.2 km' }, travel_time: {...}, traffic_aware_duration: {...} }
   * ```
   */
  getDistanceMatrixAsync(
    originPlaceId: string,
    destinationPlaceId: string,
  ): Promise<DistanceMatrixResultDto>;

  /**
   * Calculates real road travel time from a set of lat/lng origins to a single lat/lng destination.
   * Used to measure ETA from stored driver locations (which have no place_id) to the breakdown point.
   *
   * @param origins - Array of { lat, lng } coordinate pairs (driver locations)
   * @param destinationLat - Destination latitude (breakdown location)
   * @param destinationLng - Destination longitude
   * @returns Array of CoordinateDistanceResultDto, one per origin, in the same order
   */
  getDistanceMatrixByCoordinatesAsync(
    origins: { lat: number; lng: number }[],
    destinationLat: number,
    destinationLng: number,
  ): Promise<CoordinateDistanceResultDto[]>;
}
