import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { WorkflowsService, CreateWorkflowDto } from './workflows.service';

class WorkflowStepBody {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsObject()
  config!: Record<string, unknown>;
}

class CreateWorkflowBody implements CreateWorkflowDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['manual', 'schedule', 'webhook', 'telegram'])
  trigger?: CreateWorkflowDto['trigger'];

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  steps?: WorkflowStepBody[];
}

class UpdateWorkflowBody {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['manual', 'schedule', 'webhook', 'telegram'])
  trigger?: CreateWorkflowDto['trigger'];

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  steps?: WorkflowStepBody[];

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: 'active' | 'inactive' | 'draft';

  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('workflows')
export class WorkflowsController {
  constructor(private svc: WorkflowsService) {}

  @Get()
  list(@Request() req: any) { return this.svc.findAll(req.user.userId); }

  @Post()
  create(@Request() req: any, @Body() dto: CreateWorkflowBody) {
    return this.svc.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateWorkflowBody) {
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
