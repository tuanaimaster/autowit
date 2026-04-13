import {
  Body, Controller, Delete, ForbiddenException, Get, Param, Post, Request, Res, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AiService } from './ai.service';
import { MemoryService } from '../../core/memory/memory.service';

class ChatBody {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsEnum(['code', 'content', 'sales', 'automation'])
  agent?: 'code' | 'content' | 'sales' | 'automation';
}

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(
    private svc: AiService,
    private memory: MemoryService,
  ) {}

  private resolveSessionId(requestedSessionId: string | undefined, userId: string): string {
    const sessionId = requestedSessionId?.trim() || userId;
    if (sessionId !== userId) {
      throw new ForbiddenException('Cross-session access is not allowed');
    }
    return sessionId;
  }

  @Post('chat')
  async chat(
    @Body() body: ChatBody,
    @Request() req: any,
  ) {
    const sessionId = this.resolveSessionId(body.sessionId, req.user.userId);
    const ctx = {
      sessionId,
      userId: req.user.userId,
      channel: 'web',
    };
    return this.svc.chat(body.message, ctx, body.agent);
  }

  @Post('chat/stream')
  async chatStream(
    @Body() body: ChatBody,
    @Request() req: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sessionId = this.resolveSessionId(body.sessionId, req.user.userId);
    const ctx = {
      sessionId,
      userId: req.user.userId,
      channel: 'web',
    };

    try {
      const result = await this.svc.chatStream(
        body.message,
        ctx,
        (token) => {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        },
        body.agent,
      );
      res.write(`data: ${JSON.stringify({ done: true, model: result.model, costUsd: result.costUsd })}\n\n`);
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Delete('history/:sessionId')
  clearHistory(@Param('sessionId') sessionId: string, @Request() req: any) {
    return this.memory.clearHistory(this.resolveSessionId(sessionId, req.user.userId));
  }

  @Get('history/:sessionId')
  getHistory(@Param('sessionId') sessionId: string, @Request() req: any) {
    return this.memory.getHistory(this.resolveSessionId(sessionId, req.user.userId));
  }
}
