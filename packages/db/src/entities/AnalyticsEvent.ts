import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Provider } from './Provider';

export enum EventType {
  PROFILE_VIEW = 'profile_view',
  DIRECTION_CLICK = 'direction_click',
  WEBSITE_CLICK = 'website_url_click',
  TELEHEALTH_CLICK = 'telehealth_url_click'
}

@Entity()
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  provider!: Provider;

  @Column({
    type: 'enum',
    enum: EventType
  })
  type!: EventType;

  @Column({ nullable: true })
  user_agent!: string;

  @CreateDateColumn()
  created_at!: Date;
}
