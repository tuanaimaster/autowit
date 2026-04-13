import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (cfg: ConfigService) => {
        const client = new Redis(cfg.get<string>('REDIS_URL') as string, {
          maxRetriesPerRequest: 3,
          lazyConnect: false,
        });
        client.on('error', (err) => console.error('[Redis] error:', err.message));
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
