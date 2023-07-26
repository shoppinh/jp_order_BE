import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/shared/schema/base.schema';

export type AddressDocument = Address & Document;

@Schema()
export class Address extends BaseSchema {
  @Prop({
    required: true,
  })
  street1: string;
  @Prop({
    required: true,
  })
  street2: string;

  @Prop({
    required: true,
  })
  city: string;

  @Prop({
    required: true,
  })
  state: string;
  @Prop({
    required: true,
  })
  country: string;
  @Prop({
    required: true,
  })
  zip: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
