import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

@Entity('tasks')
@Index('IDX_TASK_USER_STATUS_UPDATED', ['userId', 'status', 'updatedAt'])
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ default: 'todo' })
  status!: TaskStatus;

  @Column({ default: 'medium' })
  priority!: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  ideaId!: string | null;

  @Column({ type: 'jsonb', default: [] })
  tags!: string[];

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
