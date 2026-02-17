import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Provider } from './Provider';
import { User } from './User';

@Entity()
export class SavedProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Provider, { eager: true, onDelete: 'CASCADE' })
  provider!: Provider;

  @CreateDateColumn()
  created_at!: Date;
}
