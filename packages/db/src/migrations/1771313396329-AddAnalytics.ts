import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnalytics1771313396329 implements MigrationInterface {
    name = 'AddAnalytics1771313396329'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."analytics_event_type_enum" AS ENUM('profile_view', 'direction_click', 'website_url_click', 'telehealth_url_click')`);
        await queryRunner.query(`CREATE TABLE "analytics_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."analytics_event_type_enum" NOT NULL, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "providerId" uuid, CONSTRAINT "PK_29d5b2021997dfc387aa5a05ae6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "analytics_event" ADD CONSTRAINT "FK_4bbb92176c768bb14287b2a95f2" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "analytics_event" DROP CONSTRAINT "FK_4bbb92176c768bb14287b2a95f2"`);
        await queryRunner.query(`DROP TABLE "analytics_event"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_event_type_enum"`);
    }

}
