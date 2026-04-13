import { Body, Controller, ForbiddenException, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { ChannelType } from './channel.entity';

function assertAdmin(req: any): void {
  if (req.user?.role !== 'admin') {
    throw new ForbiddenException('Forbidden');
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class ChannelsController {
  constructor(private svc: ChannelsService) {}

  @Get()
  list(@Request() req: any) {
    assertAdmin(req);
    return this.svc.findAll();
  }

  @Put(':type')
  upsert(
    @Param('type') type: ChannelType,
    @Body() body: { name: string; config: Record<string, unknown>; isActive?: boolean },
    @Request() req: any,
  ) {
    assertAdmin(req);
    return this.svc.upsert(type, body.name, body.config, body.isActive);
  }

  @Post(':type/toggle')
  toggle(@Param('type') type: ChannelType, @Request() req: any) {
    assertAdmin(req);
    return this.svc.toggle(type);
  }
}
