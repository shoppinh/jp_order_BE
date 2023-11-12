import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/shared/schema/base.schema';

export type CategoryDocument = Category & Document;

@Schema()
export class Category extends BaseSchema {
  @Prop({
    required: true,
  })
  name: string;
  @Prop({
    required: true,
  })
  label: string;

  @Prop()
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
