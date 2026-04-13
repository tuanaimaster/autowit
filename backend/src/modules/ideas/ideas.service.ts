import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdeaEntity, IdeaStatus } from './idea.entity';

export interface CreateIdeaDto {
  title: string;
  description?: string;
  tags?: string[];
  agentType?: string;
}

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(IdeaEntity)
    private repo: Repository<IdeaEntity>,
  ) {}

  async create(userId: string, dto: CreateIdeaDto): Promise<IdeaEntity> {
    const idea = this.repo.create({ ...dto, userId });
    return this.repo.save(idea);
  }

  async findAll(userId: string, status?: IdeaStatus): Promise<IdeaEntity[]> {
    const where: Record<string, unknown> = { userId };
    if (status) where['status'] = status;
    return this.repo.find({ where: where as any, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<IdeaEntity> {
    const idea = await this.repo.findOne({ where: { id, userId } });
    if (!idea) throw new NotFoundException('Idea not found');
    return idea;
  }

  async update(id: string, userId: string, patch: Partial<CreateIdeaDto & { status: IdeaStatus; aiAnalysis: string }>): Promise<IdeaEntity> {
    const idea = await this.findOne(id, userId);
    Object.assign(idea, patch);
    return this.repo.save(idea);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.repo.delete({ id, userId });
  }
}
