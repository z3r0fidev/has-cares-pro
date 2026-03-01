import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewVerifiedPatient1771333000000 implements MigrationInterface {
    name = 'AddReviewVerifiedPatient1771333000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "review" ADD "is_verified_patient" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "review" DROP COLUMN "is_verified_patient"`
        );
    }
}
