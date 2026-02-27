import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInsuranceField1771312111331 implements MigrationInterface {
    name = 'AddInsuranceField1771312111331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" ADD "insurance" character varying`);
        await queryRunner.query(`ALTER TABLE "provider" ADD "website_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "website_url"`);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "insurance"`);
    }

}
