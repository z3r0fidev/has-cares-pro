import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingAndCareTeam1771317961154 implements MigrationInterface {
    name = 'AddBookingAndCareTeam1771317961154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_date" TIMESTAMP NOT NULL, "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'pending', "reason" text, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "providerId" uuid, "patientId" uuid, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "saved_provider" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "providerId" uuid, CONSTRAINT "PK_b4b0697deb6c1390c42214053b1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "provider" ADD "availability" jsonb`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_f013bda65c235464178ac025925" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_5ce4c3130796367c93cd817948e" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_provider" ADD CONSTRAINT "FK_e69cb580af51c1d050af157abd3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_provider" ADD CONSTRAINT "FK_c0e87d3345c09683bafa7ac3516" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_provider" DROP CONSTRAINT "FK_c0e87d3345c09683bafa7ac3516"`);
        await queryRunner.query(`ALTER TABLE "saved_provider" DROP CONSTRAINT "FK_e69cb580af51c1d050af157abd3"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_5ce4c3130796367c93cd817948e"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_f013bda65c235464178ac025925"`);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "availability"`);
        await queryRunner.query(`DROP TABLE "saved_provider"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
    }

}
