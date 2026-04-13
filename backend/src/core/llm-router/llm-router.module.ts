import { Module, Global } from '@nestjs/common';
import { LlmRouterService } from './llm-router.service';

@Global()
@Module({
  providers: [LlmRouterService],
  exports: [LlmRouterService],
})
export class LlmRouterModule {}
