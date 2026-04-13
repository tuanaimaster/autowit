import { Module } from '@nestjs/common';

// DatabaseModule is a thin wrapper — TypeORM config lives in AppModule.
// Use this module when feature modules need to export shared DB utilities.
@Module({})
export class DatabaseModule {}
