import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';
import { setupSwagger, SWAGGER_PATH } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  setupSwagger(app);
  await app.listen(config.port);
  Logger.log(`Listening on port ${config.port}, public URL ${config.baseUrl}`);
  Logger.log(`API docs at ${config.baseUrl}/${SWAGGER_PATH}`);
}

void bootstrap();
