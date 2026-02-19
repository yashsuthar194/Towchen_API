import { registerAs } from '@nestjs/config';
import { NodeEnv } from '../envs/app.env';

export const appConfig = registerAs('app', () => ({
  nodeEnv: (process.env.NODE_ENV as NodeEnv) ?? NodeEnv.Development,
  port: parseInt(process.env.PORT ?? '3000', 10),
  isDev: (process.env.NODE_ENV ?? 'development') === NodeEnv.Development,
  isProd: process.env.NODE_ENV === NodeEnv.Production,
}));

export type AppConfig = ReturnType<typeof appConfig>;
