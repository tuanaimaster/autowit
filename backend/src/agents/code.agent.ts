import { Injectable } from '@nestjs/common';
import { LlmRouterService } from '../core/llm-router/llm-router.service';
import { SemanticCacheService } from '../core/semantic-cache/semantic-cache.service';
import { MemoryService } from '../core/memory/memory.service';
import { CostTrackerService } from '../core/cost-tracker/cost-tracker.service';
import { PromptCompressorService } from '../core/prompt-compressor/prompt-compressor.service';
import { BaseAgent } from './base.agent';

@Injectable()
export class CodeAgent extends BaseAgent {
  readonly name = 'code';
  readonly defaultTier = 'balanced' as const;
  readonly systemPrompt = `You are Autowit Code Agent — an expert software engineer.
You help with: writing code, debugging, code review, architecture decisions, refactoring.
Always provide clean, idiomatic code with brief explanations.
When writing code, use appropriate language and follow modern best practices.`;

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
