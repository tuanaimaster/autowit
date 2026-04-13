import { Injectable } from '@nestjs/common';
import { LlmRouterService } from '../core/llm-router/llm-router.service';
import { SemanticCacheService } from '../core/semantic-cache/semantic-cache.service';
import { MemoryService } from '../core/memory/memory.service';
import { CostTrackerService } from '../core/cost-tracker/cost-tracker.service';
import { PromptCompressorService } from '../core/prompt-compressor/prompt-compressor.service';
import { BaseAgent } from './base.agent';

@Injectable()
export class SalesAgent extends BaseAgent {
  readonly name = 'sales';
  readonly defaultTier = 'balanced' as const;
  readonly systemPrompt = `You are Autowit Sales Agent — a seasoned B2B/B2C sales strategist.
You help with: lead qualification, outreach scripts, objection handling, CRM notes,
deal pipeline advice, cold email sequences, follow-up templates, pricing strategy.
Be concise, persuasive, and data-driven.`;

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
