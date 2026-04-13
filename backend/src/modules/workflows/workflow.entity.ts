import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export type WorkflowStatus = 'active' | 'inactive' | 'draft';
export type WorkflowTrigger = 'manual' | 'schedule' | 'webhook' | 'telegram';

@Entity('workflows')
@Index('IDX_WORKFLOW_USER_STATUS_UPDATED', ['userId', 'status', 'updatedAt'])
export class WorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ default: 'draft' })
  status!: WorkflowStatus;

  @Column({ default: 'manual' })
  trigger!: WorkflowTrigger;

  @Column({ type: 'jsonb', default: {} })
  triggerConfig!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  steps!: Array<{ type: string; config: Record<string, unknown> }>;

  @Column({ name: 'n8nWorkflowId', type: 'text', nullable: true })
  webhookUrl!: string | null;

  @Column({ default: 0 })
  runCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt!: Date | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
