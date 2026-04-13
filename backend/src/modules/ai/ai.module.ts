import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MetaControllerAgent } from '../../agents/meta-controller.agent';
import { CodeAgent } from '../../agents/code.agent';
import { ContentAgent } from '../../agents/content.agent';
import { SalesAgent } from '../../agents/sales.agent';
import { AutomationAgent } from '../../agents/automation.agent';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    MetaControllerAgent,
    CodeAgent,
    ContentAgent,
    SalesAgent,
    AutomationAgent,
  ],
  exports: [AiService],
})
export class AiModule {}
