import {
  Controller, Get, Post, Put, Delete, Param, Body,
  Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IdeasService, CreateIdeaDto } from './ideas.service';
import { IdeaStatus } from './idea.entity';

class CreateIdeaBody implements CreateIdeaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  agentType?: string;
}

class UpdateIdeaBody {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  agentType?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: IdeaStatus;

  @IsOptional()
  @IsString()
  aiAnalysis?: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('ideas')
export class IdeasController {
  constructor(private svc: IdeasService) {}

  @Get()
  list(@Request() req: any, @Query('status') status?: IdeaStatus) {
    return this.svc.findAll(req.user.userId, status);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateIdeaBody) {
    return this.svc.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateIdeaBody) {
    return this.svc.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(id, req.user.userId);
  }
}
