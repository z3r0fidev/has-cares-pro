import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Provider } from './entities/Provider';
import { User } from './entities/User';
import { Review } from './entities/Review';
import { VerificationRecord } from './entities/VerificationRecord';
import { AnalyticsEvent } from './entities/AnalyticsEvent';

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
  entities: [Provider, User, Review, VerificationRecord, AnalyticsEvent],
  migrations: [__dirname + '/migrations/*.ts'],
  subscribers: [],
});
