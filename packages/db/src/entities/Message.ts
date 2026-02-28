import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './Appointment';
import { User } from './User';

/**
 * Message entity for HIPAA-compliant appointment-scoped messaging.
 *
 * - Messages are stored only in PostgreSQL (never in Elasticsearch).
 * - PHI redaction is applied by the service layer before the body is
 *   persisted here, so this column never contains raw PHI.
 * - The audit trail is provided by `created_at` and the FK references
 *   to `appointment` and `sender`.
 */
@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** The appointment thread this message belongs to. */
  @ManyToOne(() => Appointment, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  @Column({ type: 'uuid' })
  appointmentId!: string;

  /** The user who authored this message (patient or provider). */
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Column({ type: 'uuid' })
  senderId!: string;

  /**
   * Message body — PHI redaction has already been applied by the service
   * before this value is written to the database.
   */
  @Column({ type: 'text' })
  body!: string;

  /** True once the recipient has read the message. */
  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
