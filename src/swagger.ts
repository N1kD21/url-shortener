import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

/**
 * Serves Swagger UI at /docs and the raw OpenAPI document at /docs-json.
 * Must run before app.init()/listen() so these routes are registered ahead of
 * the catch-all GET /:code route. Codes are 7 characters, so "docs" never collides.
 */
export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('URL Shortener API')
      .setDescription(
        'Shortens URLs, redirects short codes to the original URL and counts visits.',
      )
      .setVersion('1.0')
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
