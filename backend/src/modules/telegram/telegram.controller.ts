import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('webhook')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private tg: TelegramService) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: object,
    @Headers('x-telegram-bot-api-secret-token') secret: string,
  ) {
    try {
      await this.tg.handleWebhookUpdate(update, secret);
    } catch (e) {
      this.logger.warn(`Webhook rejected: ${(e as Error).message}`);
    }
    return { ok: true };
  }
}
