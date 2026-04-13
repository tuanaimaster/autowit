import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';

type AgentName = 'code' | 'content' | 'sales' | 'automation';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;
  private webhookMode: boolean;

  constructor(
    private cfg: ConfigService,
    private ai: AiService,
    private users: UsersService,
  ) {}

  async onModuleInit() {
    const token = this.cfg.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram disabled');
      return;
    }

    this.bot = new Telegraf(token);
    this.webhookMode = this.cfg.get('NODE_ENV') === 'production';

    this.registerHandlers();

    if (this.webhookMode) {
      await this.bot.telegram.setWebhook(
        `${this.cfg.get('FRONTEND_URL')}/api/webhook/telegram`,
        { secret_token: this.cfg.get('TELEGRAM_WEBHOOK_SECRET') },
      );
      this.logger.log('Telegram webhook set');
    } else {
      this.bot.launch().catch(e => this.logger.error('Bot launch failed', e));
      this.logger.log('Telegram polling started');
    }
  }

  async onModuleDestroy() {
    if (this.bot && !this.webhookMode) {
      this.bot.stop('SIGTERM');
    }
  }

  private registerHandlers() {
    this.bot.start(ctx => this.handleStart(ctx));
    this.bot.help(ctx => ctx.reply(HELP_TEXT));

    // Agent selection commands
    this.bot.command('code', ctx => this.handleWithAgent(ctx, 'code'));
    this.bot.command('content', ctx => this.handleWithAgent(ctx, 'content'));
    this.bot.command('sales', ctx => this.handleWithAgent(ctx, 'sales'));
    this.bot.command('auto', ctx => this.handleWithAgent(ctx, 'automation'));

    // Free text → auto-route
    this.bot.on('text', ctx => this.handleMessage(ctx));
  }

  private async handleStart(ctx: Context) {
    const tgUser = ctx.from;
    if (tgUser) {
      await this.users.upsertByTelegram(
        String(tgUser.id),
        [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
      );
    }
    await ctx.reply(WELCOME_TEXT, { parse_mode: 'Markdown' });
  }

  private async handleWithAgent(ctx: Context, agent: AgentName) {
    const msg = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const textAfterCommand = msg.split(' ').slice(1).join(' ').trim();
    if (!textAfterCommand) {
      await ctx.reply(`Send your ${agent} request after the command. Example: /${agent === 'automation' ? 'auto' : agent} your question here`);
      return;
    }
    await this.processMessage(ctx, textAfterCommand, agent);
  }

  private async handleMessage(ctx: Context) {
    const msg = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    await this.processMessage(ctx, msg);
  }

  private async processMessage(ctx: Context, text: string, agent?: AgentName) {
    if (!text.trim()) return;

    const tgId = String(ctx.from?.id ?? 'unknown');
    const sessionId = `tg_${tgId}`;
    const userId = tgId;

    await ctx.sendChatAction('typing');

    try {
      const result = await this.ai.chat(text, { sessionId, userId, channel: 'telegram' }, agent);
      const reply = result.response.slice(0, 4096); // Telegram limit
      await ctx.reply(reply, { parse_mode: 'Markdown' });
    } catch (e) {
      this.logger.error(`Telegram chat error: ${(e as Error).message}`);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  /** Handle incoming webhook update (called from TelegramController) */
  async handleWebhookUpdate(update: object, secret?: string): Promise<void> {
    const expectedSecret = this.cfg.get('TELEGRAM_WEBHOOK_SECRET');
    if (expectedSecret && secret !== expectedSecret) {
      throw new Error('Invalid webhook secret');
    }
    if (this.bot) {
      await this.bot.handleUpdate(update as Parameters<typeof this.bot.handleUpdate>[0]);
    }
  }
}

const WELCOME_TEXT = `*Welcome to Autowit!* 🤖

I'm your AI automation assistant. Available agents:
• /code — Software development & debugging
• /content — Writing, marketing copy, SEO
• /sales — Outreach, CRM, deal strategy
• /auto — n8n workflows & automation

Or just send me a message and I'll route to the right agent.

Type /help for more info.`;

const HELP_TEXT = `Autowit Commands:
/code [question] — Code agent
/content [question] — Content agent
/sales [question] — Sales agent
/auto [question] — Automation agent
Just type freely for auto-routing.`;
