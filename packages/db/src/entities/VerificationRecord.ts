import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Provider } from './Provider';

export enum VerificationStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity()
export class VerificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Provider, provider => provider.id, { eager: true })
  provider!: Provider;

  @Column({
    type: 'enum',
    enum: [1, 2, 3],
  })
  tier!: number;

  @Column('simple-array', { nullable: true })
  document_links!: string[];

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.SUBMITTED,
  })
  status!: VerificationStatus;

  @Column({ nullable: true })
  reviewer_id!: string;

  @Column('text', { nullable: true })
  notes!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
