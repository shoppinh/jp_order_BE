import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/shared/schema/base.schema';
import { Product } from '../../product/schema/product.schema';
import { Order } from './order.schema';

export type OrderProductDocument = Document & OrderProduct;

@Schema()
export class OrderProduct extends BaseSchema {
  @Prop({
    type: Types.ObjectId,
    ref: Product.name,
    required: true,
  })
  productId: string;

  @Prop({
    type: Types.ObjectId,
    // ref: Order.name,
    required: true,
  })
  orderId: string;

  @Prop({
    required: true,
  })
  quantity: number;

  @Prop({
    required: true,
  })
  price: number;
  @Prop({
    required: false,
  })
  discount: number;
  @Prop({
    required: true,
  })
  preTaxTotal: number;
  @Prop({
    required: true,
  })
  tax: number;
  @Prop({
    required: true,
  })
  taxTotal: number;
}
export const OrderProductSchema = SchemaFactory.createForClass(OrderProduct);
