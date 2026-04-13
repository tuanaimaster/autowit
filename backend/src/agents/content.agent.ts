import { Injectable } from '@nestjs/common';
import { LlmRouterService } from '../core/llm-router/llm-router.service';
import { SemanticCacheService } from '../core/semantic-cache/semantic-cache.service';
import { MemoryService } from '../core/memory/memory.service';
import { CostTrackerService } from '../core/cost-tracker/cost-tracker.service';
import { PromptCompressorService } from '../core/prompt-compressor/prompt-compressor.service';
import { BaseAgent } from './base.agent';

@Injectable()
export class ContentAgent extends BaseAgent {
  readonly name = 'content';
  readonly defaultTier = 'balanced' as const;
  readonly systemPrompt = `You are Autowit Content Agent — a professional content writer and marketer.
You help with: blog posts, social media copy, email campaigns, product descriptions, SEO content, video scripts.
Match the tone and style requested. Optimize for engagement and readability.`;

  constructor(
    llm: LlmRouterService,
    cache: SemanticCacheService,
    memory: MemoryService,
    costTracker: CostTrackerService,
    compressor: PromptCompressorService,
  ) {
    super(llm, cache, memory, costTracker, compressor);
  }
}
