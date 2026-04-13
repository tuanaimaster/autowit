import { Injectable } from '@nestjs/common';
import { MetaControllerAgent } from '../../agents/meta-controller.agent';
import { CodeAgent } from '../../agents/code.agent';
import { ContentAgent } from '../../agents/content.agent';
import { SalesAgent } from '../../agents/sales.agent';
import { AutomationAgent } from '../../agents/automation.agent';
import { BaseAgent, AgentContext, AgentResult } from '../../agents/base.agent';

type AgentName = 'code' | 'content' | 'sales' | 'automation';

@Injectable()
export class AiService {
  private readonly agentMap: Record<AgentName, BaseAgent>;

  constructor(
    private meta: MetaControllerAgent,
    private code: CodeAgent,
    private content: ContentAgent,
    private sales: SalesAgent,
    private automation: AutomationAgent,
  ) {
    this.agentMap = { code, content, sales, automation };
  }

  async chat(
    message: string,
    ctx: AgentContext,
    agentOverride?: AgentName,
  ): Promise<AgentResult & { clarifyQuestion?: string }> {
    // Direct agent request
    if (agentOverride && this.agentMap[agentOverride]) {
      const result = await this.agentMap[agentOverride].run(message, ctx);
      return result;
    }

    // Auto-route via meta-controller
    const routing = await this.meta.route(message, ctx);

    if (routing.state === 'CLARIFY' || !routing.agentName) {
      return {
        response: routing.clarifyQuestion ?? 'Could you tell me more about what you need?',
        model: 'meta-controller',
        costUsd: 0,
        cached: false,
        agentName: 'meta-controller',
        clarifyQuestion: routing.clarifyQuestion ?? undefined,
      };
    }

    const agent = this.agentMap[routing.agentName as AgentName];
    if (!agent) {
      return {
        response: 'I could not determine the right tool for your request.',
        model: 'meta-controller',
        costUsd: 0,
        cached: false,
        agentName: 'meta-controller',
      };
    }

    return agent.run(message, ctx);
  }
}
