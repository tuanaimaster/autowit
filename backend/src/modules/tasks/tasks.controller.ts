import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService, CreateTaskDto } from './tasks.service';
import { TaskStatus } from './task.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}

  @Get()
  list(@Request() req: any, @Query('status') status?: TaskStatus) {
    return this.svc.findAll(req.user.userId, status);
  }

  @Get('kanban')
  kanban(@Request() req: any) {
    return this.svc.getKanban(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.svc.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreateTaskDto>) {
    return this.svc.update(id, req.user.userId, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Request() req: any, @Body('status') status: TaskStatus) {
    return this.svc.update(id, req.user.userId, { status });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(id, req.user.userId);
  }
}
