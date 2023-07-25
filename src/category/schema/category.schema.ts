import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from 'src/shared/schema/base.schema';

export type CategoryDocument = Document & Category;

@Schema()
export class Category extends BaseSchema {
  @Prop({
    required: true,
  })
  name: string;

  @Prop()
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
