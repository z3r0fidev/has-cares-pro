import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileImage1771309638358 implements MigrationInterface {
    name = 'AddProfileImage1771309638358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" ADD "profile_image_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "profile_image_url"`);
    }

}
