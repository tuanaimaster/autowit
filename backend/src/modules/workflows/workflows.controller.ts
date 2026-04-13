import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowsService, CreateWorkflowDto } from './workflows.service';

@UseGuards(AuthGuard('jwt'))
@Controller('workflows')
export class WorkflowsController {
  constructor(private svc: WorkflowsService) {}

  @Get()
  list(@Request() req: any) { return this.svc.findAll(req.user.userId); }

  @Post()
  create(@Request() req: any, @Body() dto: CreateWorkflowDto) {
    return this.svc.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreateWorkflowDto>) {
    return this.svc.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(id, req.user.userId);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Request() req: any, @Body() payload?: Record<string, unknown>) {
    return this.svc.execute(id, req.user.userId, payload);
  }
}
