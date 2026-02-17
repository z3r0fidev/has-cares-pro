import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Provider } from './Provider';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: ['patient', 'provider', 'admin'],
    default: 'patient'
  })
  role!: 'patient' | 'provider' | 'admin';

  @OneToOne(() => Provider, { nullable: true })
  @JoinColumn()
  provider!: Provider | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
