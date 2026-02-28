import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderBio1771330000000 implements MigrationInterface {
  name = 'AddProviderBio1771330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "provider" ADD "bio" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "bio"`);
  }
}
