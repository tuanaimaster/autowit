import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

export interface LlmRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tier?: 'auto' | 'fast' | 'balanced' | 'premium';
}

export interface LlmResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  tier: string;
}

// Cost per 1M tokens in USD
const COST_TABLE: Record<string, { input: number; output: number }> = {
  'ollama': { input: 0, output: 0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.0 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.0 },
};

@Injectable()
export class LlmRouterService {
  private readonly logger = new Logger(LlmRouterService.name);
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(private cfg: ConfigService) {
    this.openai = new OpenAI({ apiKey: cfg.get('OPENAI_API_KEY') });
    this.anthropic = new Anthropic({ apiKey: cfg.get('ANTHROPIC_API_KEY') });
  }

  async chat(req: LlmRequest): Promise<LlmResponse> {
    const tier = req.tier ?? 'auto';
    const tokenEstimate = Math.ceil((req.prompt.length + (req.systemPrompt?.length ?? 0)) / 4);

    // Tier routing logic
    if (tier === 'fast' || (tier === 'auto' && tokenEstimate < 500)) {
      try {
        return await this.callOllama(req);
      } catch {
        this.logger.warn('Ollama unavailable, falling back to gpt-4o-mini');
      }
    }

    if (tier === 'balanced' || tier === 'auto') {
      try {
        return await this.callOpenAi(req);
      } catch (e) {
        this.logger.warn(`OpenAI failed: ${(e as Error).message}, falling back to Claude`);
      }
    }

    return await this.callClaude(req);
  }

  private async callOllama(req: LlmRequest): Promise<LlmResponse> {
    const base = this.cfg.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    const model = this.cfg.get<string>('OLLAMA_MODEL', 'llama3.2:3b');
    const messages = this.buildMessages(req);

    const resp = await axios.post(`${base}/api/chat`, {
      model,
      messages,
      stream: false,
    }, { timeout: 30_000 });

    const content = resp.data.message?.content ?? '';
    return {
      content,
      model: `ollama/${model}`,
      inputTokens: resp.data.prompt_eval_count ?? 0,
      outputTokens: resp.data.eval_count ?? 0,
      costUsd: 0,
      tier: 'fast',
    };
  }

  private async callOpenAi(req: LlmRequest): Promise<LlmResponse> {
    const model = req.tier === 'premium'
      ? this.cfg.get<string>('OPENAI_MODEL_PREMIUM', 'gpt-4o')
      : this.cfg.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    const completion = await this.openai.chat.completions.create({
      model,
      messages: this.buildMessages(req),
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
    });

    const usage = completion.usage!;
    const cost = this.calcCost(model, usage.prompt_tokens, usage.completion_tokens);

    return {
      content: completion.choices[0]?.message?.content ?? '',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost,
      tier: req.tier ?? 'balanced',
    };
  }

  private async callClaude(req: LlmRequest): Promise<LlmResponse> {
    const model = this.cfg.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-4-5');

    const msg = await this.anthropic.messages.create({
      model,
      max_tokens: req.maxTokens ?? 1024,
      system: req.systemPrompt,
      messages: [{ role: 'user', content: req.prompt }],
    });

    const usage = msg.usage;
    const cost = this.calcCost(model, usage.input_tokens, usage.output_tokens);
    const content = (msg.content as Anthropic.ContentBlock[])
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('');

    return {
      content,
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: cost,
      tier: 'premium',
    };
  }

  private buildMessages(req: LlmRequest): ChatCompletionMessageParam[] {
    const msgs: ChatCompletionMessageParam[] = [];
    if (req.systemPrompt) msgs.push({ role: 'system', content: req.systemPrompt });
    msgs.push({ role: 'user', content: req.prompt });
    return msgs;
  }

  private calcCost(model: string, inputTok: number, outputTok: number): number {
    const key = Object.keys(COST_TABLE).find(k => model.includes(k)) ?? 'gpt-4o-mini';
    const rates = COST_TABLE[key];
    return (inputTok * rates.input + outputTok * rates.output) / 1_000_000;
  }
}
