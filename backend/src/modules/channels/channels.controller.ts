import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { ChannelType } from './channel.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class ChannelsController {
  constructor(private svc: ChannelsService) {}

  @Get()
  list() { return this.svc.findAll(); }

  @Put(':type')
  upsert(
    @Param('type') type: ChannelType,
    @Body() body: { name: string; config: Record<string, unknown>; isActive?: boolean },
  ) {
    return this.svc.upsert(type, body.name, body.config, body.isActive);
  }

  @Post(':type/toggle')
  toggle(@Param('type') type: ChannelType) {
    return this.svc.toggle(type);
  }
}
