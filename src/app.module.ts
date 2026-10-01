import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { LinksModule } from './links/links.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, LinksModule],
  providers: [
    {
      // Registered here (not in main.ts) so e2e tests get the exact same validation.
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // strip unknown properties...
        forbidNonWhitelisted: true, // ...or rather, reject them with a 400
        stopAtFirstError: true, // one clear message per field
      }),
    },
  ],
})
export class AppModule {}
