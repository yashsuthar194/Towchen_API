import { IsOptional, IsString, MinLength } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

@ConfigNamespace('jwt')
export class JwtConfig {
  @IsString({ message: 'JWT_SECRET must be a string' })
  @MinLength(10, {
    message: 'JWT_SECRET must be at least 10 characters long for security',
  })
  JWT_SECRET: string;

  @IsString({ message: 'JWT_EXPIRES_IN must be a valid string' })
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // Computed properties
  get secret(): string {
    return this.JWT_SECRET;
  }

  get expiresIn(): string {
    return this.JWT_EXPIRES_IN;
  }
}

// Export the loader for use in the module
export const jwtConfig = createConfigLoader(JwtConfig);
