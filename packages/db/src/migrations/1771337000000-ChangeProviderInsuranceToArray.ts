import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeProviderInsuranceToArray1771337000000 implements MigrationInterface {
    name = 'ChangeProviderInsuranceToArray1771337000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "provider" ALTER COLUMN "insurance" TYPE text USING "insurance"::text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "provider" ALTER COLUMN "insurance" TYPE character varying USING "insurance"::character varying`
        );
    }
}
