import { LlmRouterService, LlmRequest, LlmResponse } from '../core/llm-router/llm-router.service';
import { SemanticCacheService } from '../core/semantic-cache/semantic-cache.service';
import { MemoryService, ChatMessage } from '../core/memory/memory.service';
import { CostTrackerService } from '../core/cost-tracker/cost-tracker.service';
import { PromptCompressorService } from '../core/prompt-compressor/prompt-compressor.service';

export interface AgentContext {
  sessionId: string;
  userId: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResult {
  response: string;
  model: string;
  costUsd: number;
  cached: boolean;
  agentName: string;
}

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly systemPrompt: string;
  abstract readonly defaultTier: LlmRequest['tier'];

  constructor(
    protected readonly llm: LlmRouterService,
    protected readonly cache: SemanticCacheService,
    protected readonly memory: MemoryService,
    protected readonly costTracker: CostTrackerService,
    protected readonly compressor: PromptCompressorService,
  ) {}

  async run(userMessage: string, ctx: AgentContext): Promise<AgentResult> {
    const history: ChatMessage[] = await this.memory.getHistory(ctx.sessionId);

    // Check semantic cache
    const cached = await this.cache.get(userMessage, this.systemPrompt, this.defaultTier);
    if (cached) {
      return {
        response: cached,
        model: 'cache',
        costUsd: 0,
        cached: true,
        agentName: this.name,
      };
    }

    // Compress prompt
    const { fullPrompt, systemPrompt } = this.compressor.buildPrompt(
      this.systemPrompt,
      history,
      userMessage,
    );

    // Call LLM
    const llmResp: LlmResponse = await this.llm.chat({
      prompt: fullPrompt,
      systemPrompt,
      tier: this.defaultTier,
    });

    // Persist to memory + cache + cost
    await Promise.all([
      this.memory.addExchange(ctx.sessionId, userMessage, llmResp.content),
      this.cache.set(userMessage, llmResp.content, this.systemPrompt, this.defaultTier),
      this.costTracker.track(llmResp.model, llmResp.inputTokens, llmResp.outputTokens, llmResp.costUsd),
    ]);

    return {
      response: llmResp.content,
      model: llmResp.model,
      costUsd: llmResp.costUsd,
      cached: false,
      agentName: this.name,
    };
  }
}
