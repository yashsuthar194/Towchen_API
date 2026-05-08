import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { AutocompleteAddressDto } from './dto/autocomplete-address.dto';
import { ResolveAddressDto } from './dto/resolve-address.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { AddressPredictionDto } from 'src/services/maps/types/address-prediction.dto';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Get('search-address')
  @ApiOperation({
    summary: 'Step 1 — Search for addresses by any term',
    description:
      'Accepts any search term (street, area, landmark, city, pincode). ' +
      'Returns a lightweight list of predictions for the frontend dropdown. ' +
      'Use the place_id from the selected prediction to call resolve-address.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of address predictions',
    type: [AddressPredictionDto],
  })
  async searchAddress(@Query() query: AutocompleteAddressDto): Promise<AddressPredictionDto[]> {
    return await this.locationService.searchPredictionsAsync(query);
  }


}
