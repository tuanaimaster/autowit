import { Injectable, Logger } from '@nestjs/common';
import { LlmRouterService } from '../core/llm-router/llm-router.service';
import { SemanticCacheService } from '../core/semantic-cache/semantic-cache.service';
import { MemoryService } from '../core/memory/memory.service';
import { CostTrackerService } from '../core/cost-tracker/cost-tracker.service';
import { PromptCompressorService } from '../core/prompt-compressor/prompt-compressor.service';
import { BaseAgent, AgentContext, AgentResult } from './base.agent';

type AgentState = 'INTENT' | 'PLAN' | 'CLARIFY' | 'EXECUTE' | 'DONE';

interface StatePayload {
  intent?: string;
  plan?: string[];
  clarifyQuestion?: string;
  chosenAgent?: string;
}

const SYSTEM_PROMPT = `You are the Autowit meta-controller AI. Your job is to:
1. Understand the user's intent from their message.
2. Decide which specialist agent to route to: code, content, sales, or automation.
3. If the intent is unclear, ask one clarifying question.
4. If clear, output a JSON routing decision.

Always respond in valid JSON with this schema:
{
  "state": "PLAN" | "CLARIFY",
  "agent": "code" | "content" | "sales" | "automation" | null,
  "plan": ["step1", "step2", ...] | null,
  "clarifyQuestion": "question text" | null,
  "confidence": 0.0-1.0
}`;

@Injectable()
export class MetaControllerAgent extends BaseAgent {
  readonly name = 'meta-controller';
  readonly systemPrompt = SYSTEM_PROMPT;
  readonly defaultTier = 'fast' as const;
  private readonly logger = new Logger(MetaControllerAgent.name);

  constructor(
    llm: LlmRouterService,
    cache: SemanticCacheService,
    memory: MemoryService,
    costTracker: CostTrackerService,
    compressor: PromptCompressorService,
  ) {
    super(llm, cache, memory, costTracker, compressor);
  }

  async route(userMessage: string, ctx: AgentContext): Promise<{
    state: AgentState;
    agentName: string | null;
    plan: string[] | null;
    clarifyQuestion: string | null;
    confidence: number;
  }> {
    const result: AgentResult = await this.run(userMessage, ctx);

    try {
      // Extract JSON from response
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]) as StatePayload & {
        state: string;
        agent: string | null;
        confidence: number;
        clarifyQuestion?: string | null;
        plan?: string[] | null;
      };

      return {
        state: (parsed.state ?? 'CLARIFY') as AgentState,
        agentName: parsed.agent ?? null,
        plan: parsed.plan ?? null,
        clarifyQuestion: parsed.clarifyQuestion ?? null,
        confidence: parsed.confidence ?? 0.5,
      };
    } catch (e) {
      this.logger.warn(`Meta routing parse failed: ${(e as Error).message}`);
      return {
        state: 'CLARIFY',
        agentName: null,
        plan: null,
        clarifyQuestion: 'Could you tell me more about what you need?',
        confidence: 0,
      };
    }
  }
}
