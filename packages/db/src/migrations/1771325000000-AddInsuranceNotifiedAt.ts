import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInsuranceNotifiedAt1771325000000 implements MigrationInterface {
    name = 'AddInsuranceNotifiedAt1771325000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" ADD "last_insurance_notified_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "last_insurance_notified_at"`);
    }
}
