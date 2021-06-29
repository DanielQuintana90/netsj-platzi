import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //mapea solo propiedades establecidas
      forbidNonWhitelisted: true, //manda mensaje de aviso de propiedades adicionales
    }),
  );
  await app.listen(3000);
}
bootstrap();
