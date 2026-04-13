import { Module, Global } from '@nestjs/common';
import { SemanticCacheService } from './semantic-cache.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [SemanticCacheService],
  exports: [SemanticCacheService],
})
export class SemanticCacheModule {}
