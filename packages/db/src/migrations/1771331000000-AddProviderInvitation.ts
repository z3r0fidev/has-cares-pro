import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderInvitation1771331000000 implements MigrationInterface {
  name = 'AddProviderInvitation1771331000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "provider_invitation" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "providerId" uuid REFERENCES "provider"("id") ON DELETE CASCADE,
        "email" varchar NOT NULL,
        "token" uuid UNIQUE NOT NULL,
        "used_at" timestamptz,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "provider_invitation"`);
  }
}
