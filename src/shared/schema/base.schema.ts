import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BaseSchema {
  _id?: string;

  @Prop({ required: false })
  createdAt?: Date;

  @Prop({ required: false })
  updatedAt?: Date;

  @Prop({ nullable: false })
  createdBy: string;

  @Prop({ nullable: true })
  updatedBy: string;
}
