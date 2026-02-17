import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Provider } from './Provider';
import { User } from './User';

@Entity()
export class CareHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true })
  patient!: User;

  @ManyToOne(() => Provider, { eager: true })
  provider!: Provider;

  @Column({ type: 'timestamp' })
  visit_date!: Date;

  @Column('text')
  reason!: string;

  @Column('text', { nullable: true })
  diagnosis!: string;

  @Column('text', { nullable: true })
  summary!: string;

  @Column('jsonb', { nullable: true })
  prescriptions!: Array<{
    name: string;
    dosage: string;
    instructions: string;
  }>;

  @Column('jsonb', { nullable: true })
  follow_up_instructions!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
