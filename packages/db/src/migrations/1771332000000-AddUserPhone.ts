import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPhone1771332000000 implements MigrationInterface {
    name = 'AddUserPhone1771332000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying(20) DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
    }
}
