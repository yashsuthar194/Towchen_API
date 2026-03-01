import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

@ConfigNamespace('app')
export class AppConfig {
  @IsEnum(NodeEnv, {
    message: 'NODE_ENV must be one of: development, production, test',
  })
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt({ message: 'PORT must be a valid integer' })
  @Min(1, { message: 'PORT must be at least 1' })
  @Max(65535, { message: 'PORT must be at most 65535' })
  @IsOptional()
  PORT: number = 3000;

  // Computed properties
  get nodeEnv(): NodeEnv {
    return this.NODE_ENV;
  }

  get port(): number {
    return this.PORT;
  }

  get isDev(): boolean {
    return this.NODE_ENV === NodeEnv.Development;
  }

  get isProd(): boolean {
    return this.NODE_ENV === NodeEnv.Production;
  }

  get isTest(): boolean {
    return this.NODE_ENV === NodeEnv.Test;
  }
}

// Export the loader for use in the module
export const appConfig = createConfigLoader(AppConfig);
