import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderProduct } from 'src/order/schema/order-product.schema';
import { BaseSchema } from 'src/shared/schema/base.schema';
import { ORDER_STATUS } from 'src/shared/utils/constant/order';
import { Address } from 'src/user/schema/address.schema';
import { User } from 'src/user/schema/user.schema';

export type OrderDocument = Document & Order;

@Schema()
export class Order extends BaseSchema {
  @Prop({ required: true, ref: OrderProduct.name, type: [Types.ObjectId] })
  items: string[];

  @Prop({
    required: true,
  })
  totalPrice: number;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: false,
  })
  userId: string;

  @Prop({
    type: Types.ObjectId,
    ref: Address.name,
    required: false,
  })
  addressId: string;

  @Prop({
    required: false,
  })
  guestAddress: string;

  @Prop({
    required: true,
  })
  fullName: string;

  @Prop({
    required: true,
  })
  phone: string;

  @Prop({
    required: true,
    default: ORDER_STATUS.CONFIRMED,
  })
  status: string;

  @Prop({
    required: true,
    default: 0,
  })
  totalWeight: number;

  @Prop({
    required: false,
  })
  note: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
