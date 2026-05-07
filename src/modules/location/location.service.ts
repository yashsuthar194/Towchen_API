import { Injectable } from '@nestjs/common';
import { MapsService } from 'src/services/maps/maps.service';
import { AddressPredictionDto } from 'src/services/maps/types/address-prediction.dto';
import { AutocompleteAddressDto } from './dto/autocomplete-address.dto';
import { ResolveAddressDto } from './dto/resolve-address.dto';
import { LocationResponseDto } from './dto/location-response.dto';

@Injectable()
export class LocationService {
  constructor(private readonly mapsService: MapsService) { }

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
}
