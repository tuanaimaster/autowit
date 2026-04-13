import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TasksService, CreateTaskDto } from './tasks.service';
import { TaskStatus } from './task.entity';

class CreateTaskBody implements CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: CreateTaskDto['priority'];

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  ideaId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

class UpdateTaskBody {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: CreateTaskDto['priority'];

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  ideaId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

class UpdateTaskStatusBody {
  @IsEnum(['todo', 'in_progress', 'review', 'done'])
  status!: TaskStatus;
}

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
  create(@Request() req: any, @Body() dto: CreateTaskBody) {
    return this.svc.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateTaskBody) {
    return this.svc.update(id, req.user.userId, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateTaskStatusBody) {
    return this.svc.update(id, req.user.userId, { status: dto.status });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(id, req.user.userId);
  }
}
