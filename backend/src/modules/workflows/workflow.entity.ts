import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export type WorkflowStatus = 'active' | 'inactive' | 'draft';
export type WorkflowTrigger = 'manual' | 'schedule' | 'webhook' | 'telegram';

@Entity('workflows')
export class WorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'draft' })
  status: WorkflowStatus;

  @Column({ default: 'manual' })
  trigger: WorkflowTrigger;

  @Column({ type: 'jsonb', default: {} })
  triggerConfig: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  steps: Array<{ type: string; config: Record<string, unknown> }>;

  @Column({ nullable: true })
  n8nWorkflowId: string;

  @Column({ default: 0 })
  runCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
