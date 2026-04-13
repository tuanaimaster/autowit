import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByTelegramId(telegramId: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { telegramId } });
  }

  async create(email: string, password: string, name?: string): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.repo.create({ email, passwordHash, name });
    return this.repo.save(user);
  }

  async upsertByTelegram(telegramId: string, name?: string): Promise<UserEntity> {
    let user = await this.findByTelegramId(telegramId);
    if (!user) {
      user = this.repo.create({
        telegramId,
        name: name ?? `tg_${telegramId}`,
        email: `tg_${telegramId}@autowit.internal`,
        passwordHash: '',
      });
      user = await this.repo.save(user);
    }
    return user;
  }

  async validatePassword(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async list(page = 1, limit = 50): Promise<{ data: UserEntity[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
