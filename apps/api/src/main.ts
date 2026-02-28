import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

const REQUIRED_ENV = [
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'ELASTICSEARCH_NODE',
  'JWT_SECRET',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[bootstrap] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[bootstrap] Set these in your .env file or deployment environment and restart.');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
