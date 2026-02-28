import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Provider } from './Provider';

@Entity()
export class ProviderInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Provider, { eager: false })
  provider!: Provider;

  @Column()
  email!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ type: 'timestamptz', nullable: true })
  used_at!: Date | null;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @CreateDateColumn()
  created_at!: Date;
}
