import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './service/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schema/order.schema';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';
import { OrderProductService } from './service/order-product.service';
import {
  OrderProduct,
  OrderProductSchema,
} from './schema/order-product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: OrderProduct.name,
        schema: OrderProductSchema,
      },
    ]),
    UserModule,
    ProductModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderProductService],
})
export class OrderModule {}
