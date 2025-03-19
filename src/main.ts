import { NestFactory } from '@nestjs/core';
import { AppModule } from './Components/app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GlobalService } from './Components/global/global.service';

ConfigModule.forRoot();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const globalService = app.get(GlobalService)

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter(globalService));

  app.enableCors({
    origin: configService.get<string>('ALLOWED_ORIGINS')?.split(',') ?? '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('TicXpress API')
    .setDescription('API documentation for TicXpress')
    .setVersion('1.0')
    .addTag('TicXpress')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, document);

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
  console.log(`Server is listening on port ${port}`);
}
bootstrap();
