import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
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
    required: true,
  })
  description: string;

  @Prop({
    required: true,
  })
  imageUrl: string;

  @Prop({
    required: true,
  })
  SKU: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
