import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

export enum VerificationTier {
  PROFESSIONAL = 1,
  IDENTITY = 2,
  PRACTICE = 3,
}

export interface Point {
  type: 'Point';
  coordinates: [number, number];
}

@Entity()
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('simple-array')
  credentials!: string[];

  @Column('simple-array')
  specialties!: string[];

  @Column('simple-array')
  languages!: string[];

  @Column({ type: 'simple-array', nullable: true })
  insurance!: string[] | null;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  location!: Point; // PostGIS Point

  @Column('jsonb')
  address!: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };

  @Column({
    type: 'enum',
    enum: VerificationTier,
    default: VerificationTier.PROFESSIONAL,
  })
  verification_tier!: VerificationTier;

  @Column({ default: false })
  is_claimed!: boolean;

  @Column('simple-array', { nullable: true })
  identity_tags!: string[];

  @Column({ nullable: true })
  telehealth_url!: string;

  @Column({ nullable: true })
  website_url!: string;

  @Column({ nullable: true })
  profile_image_url!: string;

  @Column('jsonb', { nullable: true })
  availability!: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  last_insurance_notified_at!: Date | null;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
