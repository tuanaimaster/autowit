import {
  Controller, Post, Get, Delete, Body, Param, Res, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AiService } from './ai.service';
import { MemoryService } from '../../core/memory/memory.service';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(
    private svc: AiService,
    private memory: MemoryService,
  ) {}

  @Post('chat')
  async chat(
    @Body() body: { message: string; sessionId?: string; agent?: 'code' | 'content' | 'sales' | 'automation' },
    @Request() req: any,
  ) {
    const ctx = {
      sessionId: body.sessionId ?? req.user.userId,
      userId: req.user.userId,
      channel: 'web',
    };
    return this.svc.chat(body.message, ctx, body.agent);
  }

  @Post('chat/stream')
  async chatStream(
    @Body() body: { message: string; sessionId?: string; agent?: 'code' | 'content' | 'sales' | 'automation' },
    @Request() req: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const ctx = {
      sessionId: body.sessionId ?? req.user.userId,
      userId: req.user.userId,
      channel: 'web',
    };

    try {
      const result = await this.svc.chat(body.message, ctx, body.agent);
      // Stream response word-by-word
      const words = result.response.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`);
        await new Promise(r => setTimeout(r, 20));
      }
      res.write(`data: ${JSON.stringify({ done: true, model: result.model, costUsd: result.costUsd })}\n\n`);
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Delete('history/:sessionId')
  clearHistory(@Param('sessionId') sessionId: string, @Request() req: any) {
    return this.memory.clearHistory(sessionId);
  }

  @Get('history/:sessionId')
  getHistory(@Param('sessionId') sessionId: string) {
    return this.memory.getHistory(sessionId);
  }
}
