import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Provider } from './Provider';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Provider, provider => provider.id)
  provider!: Provider;

  @Column()
  patient_id!: string;

  @Column('float')
  rating_total!: number;

  @Column('int')
  rating_wait_time!: number;

  @Column('int')
  rating_bedside_manner!: number;

  @Column('int')
  rating_cultural_sensitivity!: number;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'published', 'flagged', 'rejected'],
    default: 'pending'
  })
  status!: string;

  /** True when the reviewer has a confirmed or past-pending appointment with this provider. */
  @Column({ type: 'boolean', default: false })
  is_verified_patient!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
