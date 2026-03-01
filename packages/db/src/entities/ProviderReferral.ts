import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Provider } from './Provider';
import { User } from './User';

/**
 * Records a provider-to-provider referral for a specific patient.
 *
 * Lifecycle:
 *   pending  ->  accepted  (toProvider accepts the referral)
 *   pending  ->  declined  (toProvider declines the referral)
 */
@Entity()
export class ProviderReferral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** The provider who is initiating the referral. */
  @ManyToOne(() => Provider, { eager: true, nullable: false })
  fromProvider!: Provider;

  /** The provider being referred to. */
  @ManyToOne(() => Provider, { eager: true, nullable: false })
  toProvider!: Provider;

  /** The patient being referred. */
  @ManyToOne(() => User, { eager: true, nullable: false })
  patient!: User;

  /** Optional clinical note accompanying the referral. */
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  })
  status!: 'pending' | 'accepted' | 'declined';

  @CreateDateColumn()
  created_at!: Date;
}
