import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class SemanticCacheService {
  private readonly logger = new Logger(SemanticCacheService.name);
  private readonly ttlSimple: number;
  private readonly ttlHeavy: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private cfg: ConfigService,
  ) {
    this.ttlSimple = cfg.get<number>('CACHE_TTL_SIMPLE', 300);
    this.ttlHeavy = cfg.get<number>('CACHE_TTL_HEAVY', 1800);
  }

  /** Build cache key from prompt + model tier */
  private key(prompt: string, systemPrompt = '', tier = 'auto'): string {
    const hash = createHash('md5')
      .update(`${tier}|${systemPrompt}|${prompt}`)
      .digest('hex');
    return `aw:cache:${hash}`;
  }

  async get(prompt: string, systemPrompt?: string, tier?: string): Promise<string | null> {
    const k = this.key(prompt, systemPrompt, tier);
    try {
      return await this.redis.get(k);
    } catch (e) {
      this.logger.warn(`Cache get failed: ${(e as Error).message}`);
      return null;
    }
  }

  async set(
    prompt: string,
    response: string,
    systemPrompt?: string,
    tier?: string,
    heavy = false,
  ): Promise<void> {
    const k = this.key(prompt, systemPrompt, tier);
    const ttl = heavy ? this.ttlHeavy : this.ttlSimple;
    try {
      await this.redis.set(k, response, 'EX', ttl);
    } catch (e) {
      this.logger.warn(`Cache set failed: ${(e as Error).message}`);
    }
  }

  async invalidate(prompt: string, systemPrompt?: string, tier?: string): Promise<void> {
    const k = this.key(prompt, systemPrompt, tier);
    await this.redis.del(k);
  }
}
