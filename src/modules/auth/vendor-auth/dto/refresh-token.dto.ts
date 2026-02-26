import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for refreshing access tokens using a refresh token
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refresh_token: string;
}
