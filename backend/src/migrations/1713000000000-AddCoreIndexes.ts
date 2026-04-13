import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoreIndexes1713000000000 implements MigrationInterface {
  name = 'AddCoreIndexes1713000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_TASK_USER_STATUS_UPDATED" ON "tasks" ("userId", "status", "updatedAt")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_WORKFLOW_USER_STATUS_UPDATED" ON "workflows" ("userId", "status", "updatedAt")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_IDEA_USER_STATUS_UPDATED" ON "ideas" ("userId", "status", "updatedAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_TASK_USER_STATUS_UPDATED"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_WORKFLOW_USER_STATUS_UPDATED"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_IDEA_USER_STATUS_UPDATED"');
  }
}
