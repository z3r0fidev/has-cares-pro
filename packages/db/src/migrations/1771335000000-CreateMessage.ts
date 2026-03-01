import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: CreateMessage
 *
 * Creates the `message` table for appointment-scoped, HIPAA-compliant
 * provider-to-patient messaging.  Messages are never indexed in
 * Elasticsearch; PostgreSQL is the sole authoritative store.
 */
export class CreateMessage1771335000000 implements MigrationInterface {
  name = 'CreateMessage1771335000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "message" (
        "id"            uuid          DEFAULT uuid_generate_v4() PRIMARY KEY,
        "appointmentId" uuid          NOT NULL REFERENCES "appointment"("id") ON DELETE CASCADE,
        "senderId"      uuid          NOT NULL REFERENCES "user"("id")        ON DELETE CASCADE,
        "body"          text          NOT NULL,
        "read"          boolean       NOT NULL DEFAULT false,
        "created_at"    timestamptz   NOT NULL DEFAULT now()
      )
    `);

    /* Indexes to support the two most common queries:
       1. Fetch a full thread ordered by time.
       2. Count unread messages for a given user. */
    await queryRunner.query(`
      CREATE INDEX "IDX_message_appointment_created"
        ON "message" ("appointmentId", "created_at" ASC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_sender_read"
        ON "message" ("senderId", "read")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_sender_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_appointment_created"`);
    await queryRunner.query(`DROP TABLE "message"`);
  }
}
