import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV !== 'production') {
    app.enableCors();
    const config = new DocumentBuilder()
      .setTitle('JP_Order')
      .setDescription('JP_Order API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }
  const server = await app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(
      '\x1b[33m%s\x1b[0m',
      `Server :: Running @ 'http://localhost:${process.env.PORT}'`,
    );
    console.log(
      '\x1b[33m%s\x1b[0m',
      `Swagger :: Running @ 'http://localhost:${process.env.PORT}/swagger'`,
    );
  });
  server.setTimeout(Number(process.env.APP_TIME_OUT));
}
bootstrap();
