import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const MAX_HISTORY = 10;
const TTL_SECONDS = 1800; // 30 min

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private key(sessionId: string): string {
    return `aw:mem:${sessionId}`;
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const raw = await this.redis.get(this.key(sessionId));
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  async addMessage(sessionId: string, msg: ChatMessage): Promise<void> {
    const history = await this.getHistory(sessionId);
    history.push(msg);

    // Keep only last MAX_HISTORY messages
    const trimmed = history.slice(-MAX_HISTORY);
    await this.redis.set(this.key(sessionId), JSON.stringify(trimmed), 'EX', TTL_SECONDS);
  }

  async addExchange(sessionId: string, userMsg: string, assistantMsg: string): Promise<void> {
    const now = Date.now();
    const history = await this.getHistory(sessionId);
    history.push(
      { role: 'user', content: userMsg, timestamp: now },
      { role: 'assistant', content: assistantMsg, timestamp: now + 1 },
    );
    const trimmed = history.slice(-MAX_HISTORY);
    await this.redis.set(this.key(sessionId), JSON.stringify(trimmed), 'EX', TTL_SECONDS);
  }

  async clearHistory(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  /** Format history as a context string for prompts */
  formatForPrompt(history: ChatMessage[]): string {
    return history
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }
}
