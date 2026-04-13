import { Injectable } from '@nestjs/common';
import { LlmRouterService } from '../core/llm-router/llm-router.service';
import { SemanticCacheService } from '../core/semantic-cache/semantic-cache.service';
import { MemoryService } from '../core/memory/memory.service';
import { CostTrackerService } from '../core/cost-tracker/cost-tracker.service';
import { PromptCompressorService } from '../core/prompt-compressor/prompt-compressor.service';
import { BaseAgent } from './base.agent';

@Injectable()
export class AutomationAgent extends BaseAgent {
  readonly name = 'automation';
  readonly defaultTier = 'balanced' as const;
  readonly systemPrompt = `You are Autowit Automation Agent — an n8n and workflow automation expert.
You help with: designing n8n workflows, API integrations, webhook configuration,
Zalo/Telegram bot flows, data transformation, scheduled tasks, error handling.
Provide step-by-step guidance and example n8n node configurations in JSON.`;

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
