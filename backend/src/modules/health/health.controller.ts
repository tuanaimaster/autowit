import { Controller, Get, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../core/redis/redis.module';
import axios from 'axios';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly cfg: ConfigService,
  ) {}

  @Get()
  async check() {
    const [db, redisCheck, n8n] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkN8n(),
    ]);

    const status = {
      database: db.status === 'fulfilled' ? 'up' : 'down',
      redis: redisCheck.status === 'fulfilled' ? 'up' : 'down',
      n8n: n8n.status === 'fulfilled' ? 'up' : 'down',
    };

    const allUp = status.database === 'up' && status.redis === 'up' && status.n8n === 'up';
    return {
      status: allUp ? 'ok' : 'degraded',
      service: 'autowit-api',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      ...status,
    };
  }

  private async checkDatabase(): Promise<void> {
    await this.dataSource.query('SELECT 1');
  }

  private async checkRedis(): Promise<void> {
    const result = await this.redis.ping();
    if (result !== 'PONG') throw new Error('Redis PING failed');
  }

  private async checkN8n(): Promise<void> {
    const n8nUrl = this.cfg.get<string>('N8N_BASE_URL', 'http://127.0.0.1:5678');
    await axios.get(`${n8nUrl}/healthz`, { timeout: 3_000 });
  }
}

