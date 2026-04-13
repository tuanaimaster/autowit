import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

// Core
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { LlmRouterModule } from './core/llm-router/llm-router.module';
import { SemanticCacheModule } from './core/semantic-cache/semantic-cache.module';
import { MemoryModule } from './core/memory/memory.module';
import { CostTrackerModule } from './core/cost-tracker/cost-tracker.module';
import { PromptCompressorModule } from './core/prompt-compressor/prompt-compressor.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IdeasModule } from './modules/ideas/ideas.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Config — load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.production'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    // Scheduling + Events
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    // TypeORM (PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: cfg.get('NODE_ENV') !== 'production',
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        migrationsRun: cfg.get('NODE_ENV') === 'production',
        logging: cfg.get('NODE_ENV') === 'development',
        ssl: cfg.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),

    // Bull (Redis queues)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        redis: cfg.get<string>('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),

    // Core services
    DatabaseModule,
    RedisModule,
    LlmRouterModule,
    SemanticCacheModule,
    MemoryModule,
    CostTrackerModule,
    PromptCompressorModule,

    // Feature modules
    AuthModule,
    UsersModule,
    IdeasModule,
    TasksModule,
    WorkflowsModule,
    AiModule,
    AdminModule,
    ChannelsModule,
    TelegramModule,
    HealthModule,
  ],
})
export class AppModule {}
