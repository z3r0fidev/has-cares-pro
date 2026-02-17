import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Provider } from './Provider';
import { User } from './User';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Provider, { eager: true })
  provider!: Provider;

  @ManyToOne(() => User, { eager: true })
  patient!: User;

  @Column({ type: 'timestamp' })
  appointment_date!: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING
  })
  status!: AppointmentStatus;

  @Column('text', { nullable: true })
  reason!: string;

  @Column('text', { nullable: true })
  notes!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
