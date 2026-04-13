import { Module, Global } from '@nestjs/common';
import { CostTrackerService } from './cost-tracker.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [CostTrackerService],
  exports: [CostTrackerService],
})
export class CostTrackerModule {}
