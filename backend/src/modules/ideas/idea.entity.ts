import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export type IdeaStatus = 'draft' | 'active' | 'archived';

@Entity('ideas')
@Index('IDX_IDEA_USER_STATUS_UPDATED', ['userId', 'status', 'updatedAt'])
export class IdeaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'draft' })
  status: IdeaStatus;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ nullable: true })
  agentType: string;

  @Column({ type: 'text', nullable: true })
  aiAnalysis: string;

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
