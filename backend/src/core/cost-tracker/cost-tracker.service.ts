import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

export interface UsageStat {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  calls: number;
}

const KEY_PREFIX = 'aw:cost';
const TTL_7D = 7 * 24 * 3600;

@Injectable()
export class CostTrackerService {
  private readonly logger = new Logger(CostTrackerService.name);
  private readonly alertThreshold: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private cfg: ConfigService,
  ) {
    this.alertThreshold = cfg.get<number>('DAILY_COST_ALERT_USD', 2.0);
  }

  async track(model: string, inputTokens: number, outputTokens: number, costUsd: number): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${KEY_PREFIX}:${today}`;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.hincrbyfloat(key, `${model}:input`, inputTokens);
      pipeline.hincrbyfloat(key, `${model}:output`, outputTokens);
      pipeline.hincrbyfloat(key, `${model}:cost`, costUsd);
      pipeline.hincrby(key, `${model}:calls`, 1);
      pipeline.hincrbyfloat(key, 'total:cost', costUsd);
      pipeline.expire(key, TTL_7D);
      await pipeline.exec();

      // Alert if daily cost exceeds threshold
      const totalRaw = await this.redis.hget(key, 'total:cost');
      if (totalRaw && parseFloat(totalRaw) >= this.alertThreshold) {
        this.logger.warn(`[CostAlert] Daily AI cost $${parseFloat(totalRaw).toFixed(4)} >= $${this.alertThreshold}`);
      }
    } catch (e) {
      this.logger.warn(`Cost tracking failed: ${(e as Error).message}`);
    }
  }

  async getDailyStats(date?: string): Promise<Record<string, string>> {
    const d = date ?? new Date().toISOString().slice(0, 10);
    const key = `${KEY_PREFIX}:${d}`;
    try {
      return (await this.redis.hgetall(key)) ?? {};
    } catch {
      return {};
    }
  }

  async getWeeklyTotal(): Promise<number> {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      days.push(d);
    }
    let total = 0;
    for (const d of days) {
      const stats = await this.getDailyStats(d);
      total += parseFloat(stats['total:cost'] ?? '0');
    }
    return Math.round(total * 10000) / 10000;
  }
}
