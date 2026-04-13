import {
  Controller, Get, Post, Put, Delete, Param, Body,
  Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IdeasService, CreateIdeaDto } from './ideas.service';
import { IdeaStatus } from './idea.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('ideas')
export class IdeasController {
  constructor(private svc: IdeasService) {}

  @Get()
  list(@Request() req: any, @Query('status') status?: IdeaStatus) {
    return this.svc.findAll(req.user.userId, status);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateIdeaDto) {
    return this.svc.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreateIdeaDto>) {
    return this.svc.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(id, req.user.userId);
  }
}
