import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './shared/auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const server = app.getHttpServer();
  const router = server._events.request._router;
  if (router) {
    const logger = new Logger('Routes');
    logger.log('--- Registered Routes ---');
    router.stack.forEach((layer: any) => {
      if (layer.route) {
        const path = layer.route.path;
        const method = Object.keys(layer.route.methods)[0].toUpperCase();
        logger.log(`${method} ${path}`);
      }
    });
    logger.log('-------------------------');
  }

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
