import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { AutocompleteAddressDto } from './dto/autocomplete-address.dto';
import { ResolveAddressDto } from './dto/resolve-address.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { AddressPredictionDto } from 'src/services/maps/types/address-prediction.dto';
import { OrderEstimateBodyDto } from './dto/order-estimate-body.dto';
import { OrderEstimateResponseDto } from './dto/order-estimate-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';

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
      'Use the place_id from the selected prediction to call estimate.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of address predictions',
    type: [AddressPredictionDto],
  })
  async searchAddress(@Query() query: AutocompleteAddressDto): Promise<AddressPredictionDto[]> {
    return await this.locationService.searchPredictionsAsync(query);
  }

  @Get('resolve-address')
  @ApiOperation({
    summary: 'Step 2 — Resolve full address from Google place_id',
    description: 'Accepts a Google Maps place_id and returns the complete structured address with lat/lng coordinates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Full resolved address object',
    type: LocationResponseDto,
  })
  async resolveAddress(@Query() query: ResolveAddressDto): Promise<LocationResponseDto> {
    return await this.locationService.resolveAddressAsync(query);
  }

  @Get('reverse-geocode')
  @ApiOperation({
    summary: 'Reverse Geocode — Coordinates (lat/lng) to formatted address',
    description: 'Accepts latitude and longitude and returns the accurate human-readable street address via Google Maps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accurate formatted address for current location coordinates',
    type: LocationResponseDto,
  })
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ): Promise<LocationResponseDto> {
    return await this.locationService.reverseGeocodeAsync(Number(lat), Number(lng));
  }


  @Post('estimate')
  @ApiOperation({
    summary: 'Get order estimate — distance, travel time & sub-service pricing',
    description:
      'Accepts a breakdown (pickup) place_id and a dropoff (destination) place_id. ' +
      'Calls the Google Distance Matrix API to get real road distance, travel time, ' +
      'and traffic-aware duration. Returns ALL active sub-services with their total ' +
      'price calculated for this specific journey distance.\n\n' +
      '**Pricing formula per sub-service:**\n' +
      '- `extra_km = max(0, actual_km - base_distance)`\n' +
      '- `extra_charge = extra_km * extra_distance_price`\n' +
      '- `total_price = base_price + extra_charge`',
  })
  @ApiResponseDto(OrderEstimateResponseDto)
  async getOrderEstimate(
    @Body() body: OrderEstimateBodyDto,
  ): Promise<ResponseDto<OrderEstimateResponseDto>> {
    const estimate = await this.locationService.getOrderEstimateAsync(body);
    return ResponseDto.retrieved('Order estimate retrieved successfully', estimate);
  }
}
