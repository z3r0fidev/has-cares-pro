import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProviderReferral1771334000000 implements MigrationInterface {
    name = 'CreateProviderReferral1771334000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "provider_referral_status_enum" AS ENUM ('pending', 'accepted', 'declined')
        `);

        await queryRunner.query(`
            CREATE TABLE "provider_referral" (
                "id"               uuid                              NOT NULL DEFAULT uuid_generate_v4(),
                "note"             text,
                "status"           "provider_referral_status_enum"   NOT NULL DEFAULT 'pending',
                "created_at"       TIMESTAMP                         NOT NULL DEFAULT now(),
                "fromProviderId"   uuid                              NOT NULL,
                "toProviderId"     uuid                              NOT NULL,
                "patientId"        uuid                              NOT NULL,
                CONSTRAINT "PK_provider_referral" PRIMARY KEY ("id"),
                CONSTRAINT "FK_referral_from_provider"  FOREIGN KEY ("fromProviderId")  REFERENCES "provider"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_referral_to_provider"    FOREIGN KEY ("toProviderId")    REFERENCES "provider"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_referral_patient"        FOREIGN KEY ("patientId")       REFERENCES "user"("id")     ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "provider_referral"`);
        await queryRunner.query(`DROP TYPE "provider_referral_status_enum"`);
    }
}
