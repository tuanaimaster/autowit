import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkflowEntity, WorkflowStatus, WorkflowTrigger } from './workflow.entity';
import axios from 'axios';

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  trigger?: WorkflowTrigger;
  triggerConfig?: Record<string, unknown>;
  steps?: Array<{ type: string; config: Record<string, unknown> }>;
}

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowEntity)
    private repo: Repository<WorkflowEntity>,
    private cfg: ConfigService,
  ) {}

  create(userId: string, dto: CreateWorkflowDto): Promise<WorkflowEntity> {
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  findAll(userId: string): Promise<WorkflowEntity[]> {
    return this.repo.find({ where: { userId }, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<WorkflowEntity> {
    const wf = await this.repo.findOne({ where: { id, userId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async update(id: string, userId: string, patch: Partial<CreateWorkflowDto & { status: WorkflowStatus }>): Promise<WorkflowEntity> {
    const wf = await this.findOne(id, userId);
    Object.assign(wf, patch);
    return this.repo.save(wf);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.repo.delete({ id, userId });
  }

  async execute(id: string, userId: string, payload?: Record<string, unknown>): Promise<unknown> {
    const wf = await this.findOne(id, userId);
    if (wf.n8nWorkflowId) {
      const n8nUrl = this.cfg.get<string>('N8N_BASE_URL', 'http://127.0.0.1:5678');
      const n8nKey = this.cfg.get<string>('N8N_API_KEY', '');
      const resp = await axios.post(
        `${n8nUrl}/api/v1/workflows/${wf.n8nWorkflowId}/execute`,
        { workflowData: { nodes: [], connections: {} }, startNodes: [], data: { main: [[{ json: payload ?? {} }]] } },
        { headers: { 'X-N8N-API-KEY': n8nKey } },
      );
      wf.runCount += 1;
      wf.lastRunAt = new Date();
      await this.repo.save(wf);
      return resp.data;
    }
    wf.runCount += 1;
    wf.lastRunAt = new Date();
    await this.repo.save(wf);
    return { status: 'executed', workflowId: id, steps: wf.steps.length };
  }
}
