import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Provider } from './entities/Provider';
import { User } from './entities/User';
import { Review } from './entities/Review';
import { VerificationRecord } from './entities/VerificationRecord';
import { AnalyticsEvent } from './entities/AnalyticsEvent';
import { Appointment } from './entities/Appointment';
import { SavedProvider } from './entities/SavedProvider';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'careequity',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [Provider, User, Review, VerificationRecord, AnalyticsEvent, Appointment, SavedProvider],
  migrations: [__dirname + '/migrations/*.ts'],
  subscribers: [],
});
