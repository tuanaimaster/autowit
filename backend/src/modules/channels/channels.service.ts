import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelEntity, ChannelType } from './channel.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(ChannelEntity)
    private repo: Repository<ChannelEntity>,
  ) {}

  findAll(): Promise<ChannelEntity[]> {
    return this.repo.find({ order: { type: 'ASC' } });
  }

  findByType(type: ChannelType): Promise<ChannelEntity | null> {
    return this.repo.findOne({ where: { type } });
  }

  async upsert(type: ChannelType, name: string, config: Record<string, unknown>, isActive = false): Promise<ChannelEntity> {
    let ch = await this.findByType(type);
    if (!ch) {
      ch = this.repo.create({ type, name, config, isActive });
    } else {
      ch.name = name;
      ch.config = config;
      ch.isActive = isActive;
    }
    return this.repo.save(ch);
  }

  async toggle(type: ChannelType): Promise<ChannelEntity | null> {
    const ch = await this.findByType(type);
    if (!ch) return null;
    ch.isActive = !ch.isActive;
    return this.repo.save(ch);
  }
}
