import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../memory/memory.service';

const CHARS_PER_TOKEN = 4;
const DEFAULT_BUDGET = 2000;

@Injectable()
export class PromptCompressorService {
  /**
   * Trim conversation history so total token budget stays within limit.
   * Removes oldest messages first (keeps system message if present).
   */
  compress(
    systemPrompt: string,
    history: ChatMessage[],
    userPrompt: string,
    budget = DEFAULT_BUDGET,
  ): { systemPrompt: string; history: ChatMessage[]; userPrompt: string } {
    const estimateTokens = (s: string) => Math.ceil(s.length / CHARS_PER_TOKEN);

    let total =
      estimateTokens(systemPrompt) +
      estimateTokens(userPrompt) +
      history.reduce((s, m) => s + estimateTokens(m.content), 0);

    const trimmed = [...history];

    // Remove oldest messages until within budget
    while (total > budget && trimmed.length > 0) {
      const removed = trimmed.shift()!;
      total -= estimateTokens(removed.content);
    }

    // If still over budget, truncate userPrompt
    if (total > budget) {
      const maxChars = (budget - estimateTokens(systemPrompt)) * CHARS_PER_TOKEN;
      return {
        systemPrompt,
        history: [],
        userPrompt: userPrompt.slice(0, maxChars),
      };
    }

    return { systemPrompt, history: trimmed, userPrompt };
  }

  /** Build a single prompt string from compressed parts */
  buildPrompt(
    systemPrompt: string,
    history: ChatMessage[],
    userPrompt: string,
    budget = DEFAULT_BUDGET,
  ): { fullPrompt: string; systemPrompt: string } {
    const { history: h, userPrompt: up, systemPrompt: sp } =
      this.compress(systemPrompt, history, userPrompt, budget);

    const historyText = h.length
      ? h.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\n'
      : '';

    return {
      systemPrompt: sp,
      fullPrompt: `${historyText}User: ${up}`,
    };
  }
}
