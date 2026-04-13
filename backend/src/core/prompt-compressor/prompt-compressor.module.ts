import { Module, Global } from '@nestjs/common';
import { PromptCompressorService } from './prompt-compressor.service';

@Global()
@Module({
  providers: [PromptCompressorService],
  exports: [PromptCompressorService],
})
export class PromptCompressorModule {}
