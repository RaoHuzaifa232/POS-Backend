import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('POS APIs')
    .setDescription('The POS APIs')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  
  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Seed database with initial data
  const seedService = app.get(SeedService);
  await seedService.seedDatabase();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 POS Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 API Documentation available at http://localhost:${process.env.PORT ?? 3000}/api`);
}
void bootstrap();
