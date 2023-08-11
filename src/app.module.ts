import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppInterceptor } from './shared/interceptor/app.interceptor';
import { HttpExceptionFilter } from './shared/response/http-exception.filter';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { TransactionModule } from './transaction/transaction.module';
import { SettingModule } from './setting/setting.module';
import { AuditModule } from './audit/audit.module';
import { MailsModule } from './mails/mails.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_DB_URI,
        dbName: process.env.MONGO_DB_NAME,
        user: process.env.MONGO_DB_USER,
        pass: process.env.MONGO_DB_PASS,
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: process.env.DEFAULT_LANGUAGE || 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['locale'])],
    }),
    AuthModule,
    UserModule,
    AdminModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    TransactionModule,
    SettingModule,
    AuditModule,
    MailsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AppInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({}),
    },
    AppService,
  ],
})
export class AppModule {}
