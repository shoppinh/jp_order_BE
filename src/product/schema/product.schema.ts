import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/category/schema/category.schema';
import { BaseSchema } from 'src/shared/schema/base.schema';

export type ProductDocument = Document & Product;

@Schema()
export class Product extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  categoryId: string;

  @Prop({
    required: true,
  })
  price: number;
  @Prop({
    required: false,
    default: 0,
  })
  salePrice: number;

  @Prop({
    required: false,
  })
  description: string;

  @Prop({
    required: false,
    type: [String],
  })
  imageAttachments: string[];

  @Prop({
    required: true,
  })
  SKU: string;

  @Prop({
    required: true,
    default: 0,
  })
  quantity: number;

  @Prop({
    required: false,
  })
  productSrcURL: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
