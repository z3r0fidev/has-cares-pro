import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Provider } from './Provider';

export enum EventType {
  PROFILE_VIEW = 'profile_view',
  DIRECTION_CLICK = 'direction_click',
  WEBSITE_CLICK = 'website_url_click',
  TELEHEALTH_CLICK = 'telehealth_url_click',
  SEARCH_QUERY = 'search_query'
}

@Entity()
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE', nullable: true })
  provider?: Provider;

  @Column({
    type: 'enum',
    enum: EventType
  })
  type!: EventType;

  @Column({ nullable: true })
  user_agent!: string;

  @Column({ type: 'int', nullable: true })
  response_time_ms!: number;

  @Column({ type: 'text', nullable: true })
  metadata!: string; // JSON string for flexible search filters/queries

  @CreateDateColumn()
  created_at!: Date;
}
