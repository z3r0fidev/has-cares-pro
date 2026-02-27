import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771305873546 implements MigrationInterface {
    name = 'InitialSchema1771305873546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."provider_verification_tier_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`CREATE TABLE "provider" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "credentials" text NOT NULL, "specialties" text NOT NULL, "languages" text NOT NULL, "location" geometry(Point,4326) NOT NULL, "address" jsonb NOT NULL, "verification_tier" "public"."provider_verification_tier_enum" NOT NULL DEFAULT '1', "is_claimed" boolean NOT NULL DEFAULT false, "identity_tags" text, "telehealth_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ab2f66d8987bf1bfdd6136a2d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."verification_record_tier_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`CREATE TYPE "public"."verification_record_status_enum" AS ENUM('submitted', 'in_review', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "verification_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tier" "public"."verification_record_tier_enum" NOT NULL, "document_links" text, "status" "public"."verification_record_status_enum" NOT NULL DEFAULT 'submitted', "reviewer_id" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "providerId" uuid, CONSTRAINT "PK_7c1afeb7985d5b4f357f11044d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."review_status_enum" AS ENUM('pending', 'published', 'flagged', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" character varying NOT NULL, "rating_total" double precision NOT NULL, "rating_wait_time" integer NOT NULL, "rating_bedside_manner" integer NOT NULL, "rating_cultural_sensitivity" integer NOT NULL, "content" text NOT NULL, "status" "public"."review_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "providerId" uuid, CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "verification_record" ADD CONSTRAINT "FK_8d787a6b3a23e4e862dc66cc254" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_86d981d3560a40fa16e1de8261f" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_86d981d3560a40fa16e1de8261f"`);
        await queryRunner.query(`ALTER TABLE "verification_record" DROP CONSTRAINT "FK_8d787a6b3a23e4e862dc66cc254"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP TYPE "public"."review_status_enum"`);
        await queryRunner.query(`DROP TABLE "verification_record"`);
        await queryRunner.query(`DROP TYPE "public"."verification_record_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."verification_record_tier_enum"`);
        await queryRunner.query(`DROP TABLE "provider"`);
        await queryRunner.query(`DROP TYPE "public"."provider_verification_tier_enum"`);
    }

}
