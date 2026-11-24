import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,x-api-key,api-key',
  });

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`  Online Food Ordering System Backend Started!`);
  logger.log(`  Server URL: http://localhost:${port}`);
  logger.log(`  Frontend UI: http://localhost:${port}`);
  logger.log(`  API Key: ${process.env.API_KEY || 'food-quiz-secret-key-2026'}`);
  logger.log(`====================================================`);
}
bootstrap();
