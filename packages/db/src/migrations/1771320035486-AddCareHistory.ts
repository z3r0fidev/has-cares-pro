import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCareHistory1771320035486 implements MigrationInterface {
    name = 'AddCareHistory1771320035486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "care_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "visit_date" TIMESTAMP NOT NULL, "reason" text NOT NULL, "diagnosis" text, "summary" text, "prescriptions" jsonb, "follow_up_instructions" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid, "providerId" uuid, CONSTRAINT "PK_868475a569ce6ec43215f1d347a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "care_history" ADD CONSTRAINT "FK_197107140cc9c26d07b88d65014" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "care_history" ADD CONSTRAINT "FK_0baa12e2c889ce369fe90e45870" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "care_history" DROP CONSTRAINT "FK_0baa12e2c889ce369fe90e45870"`);
        await queryRunner.query(`ALTER TABLE "care_history" DROP CONSTRAINT "FK_197107140cc9c26d07b88d65014"`);
        await queryRunner.query(`DROP TABLE "care_history"`);
    }

}
