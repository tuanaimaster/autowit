import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity, TaskStatus, TaskPriority } from './task.entity';

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  ideaId?: string;
  tags?: string[];
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private repo: Repository<TaskEntity>,
  ) {}

  create(userId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  findAll(userId: string, status?: TaskStatus): Promise<TaskEntity[]> {
    const where: Record<string, unknown> = { userId };
    if (status) where['status'] = status;
    return this.repo.find({ where: where as any, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<TaskEntity> {
    const t = await this.repo.findOne({ where: { id, userId } });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async update(id: string, userId: string, patch: Partial<CreateTaskDto & { status: TaskStatus }>): Promise<TaskEntity> {
    const task = await this.findOne(id, userId);
    Object.assign(task, patch);
    return this.repo.save(task);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.repo.delete({ id, userId });
  }

  async getKanban(userId: string): Promise<Record<TaskStatus, TaskEntity[]>> {
    const all = await this.findAll(userId);
    return {
      todo: all.filter(t => t.status === 'todo'),
      in_progress: all.filter(t => t.status === 'in_progress'),
      review: all.filter(t => t.status === 'review'),
      done: all.filter(t => t.status === 'done'),
    };
  }
}
