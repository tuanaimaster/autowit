import { Module, Global } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
