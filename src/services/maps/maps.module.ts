import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { GoogleMapsService } from './providers/google-maps.service';
import { TypedConfigService } from 'src/core/config/typed-config.service';

/**
 * Maps module providing address search and geocoding services.
 *
 * @remarks
 * This module uses the Strategy pattern to allow switching between different map providers.
 * The current implementation supports Google Maps, with easy extension for Mapbox, HERE, etc.
 *
 * Environment variables required:
 * - GOOGLE_MAPS_API_KEYS  (single key or comma-separated "PLACES_KEY,GEOCODE_KEY")
 *
 * @example
 * Import in your module:
 * ```typescript
 * @Module({
 *   imports: [MapsModule],
 *   providers: [LocationService],
 * })
 * export class LocationModule {}
 * ```
 *
 * Use in your service:
 * ```typescript
 * constructor(private readonly mapsService: MapsService) {}
 * ```
 */
@Module({
  providers: [
    {
      provide: 'MAPS_PROVIDER',
      useFactory: (config: TypedConfigService) => {
        // Switch here to plug in a different provider (Mapbox, HERE, etc.)
        return new GoogleMapsService(config);
      },
      inject: [TypedConfigService],
    },
    MapsService,
  ],
  exports: [MapsService],
})
export class MapsModule { }
