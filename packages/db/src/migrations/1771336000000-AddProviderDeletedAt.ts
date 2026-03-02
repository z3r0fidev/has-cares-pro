import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProviderDeletedAt1771336000000 implements MigrationInterface {
    name = 'AddProviderDeletedAt1771336000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(
            `CREATE INDEX "IDX_provider_deleted_at" ON "provider" ("deleted_at") WHERE "deleted_at" IS NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_provider_deleted_at"`);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "deleted_at"`);
    }
}
