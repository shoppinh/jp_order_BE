import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { BaseSchema } from 'src/shared/schema/base.schema';
import { Address } from 'src/user/schema/address.schema';

export type OrderDocument = Document & Order;

@Schema()
export class Order extends BaseSchema {
  @Prop({ required: true, type: [ProductSchema] })
  items: Product[];

  @Prop({
    required: true,
  })
  totalPrice: number;

  @Prop({
    required: true,
  })
  srcLink: string;

  @Prop({
    type: Types.ObjectId,
    ref: Address.name,
    required: true,
  })
  addressId: string;

  @Prop({
    required: true,
  })
  status: string;

  @Prop({})
  totalWeight: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
