import { BaseSchema } from 'src/shared/schema/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type AddressDocument = Address & Document;

@Schema()
export class Address extends BaseSchema {
  @Prop({ required: true })
  province: string;
  @Prop({ required: true })
  provinceId: number;
  @Prop({ required: true })
  district: string;
  @Prop({ required: true })
  districtId: number;
  @Prop({ required: true })
  ward: string;
  @Prop({ required: true })
  wardId: number;
  @Prop({ required: true })
  address: string;
  @Prop({ required: true })
  country: string;
  @Prop({ required: true })
  zip: string;
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: string;
  @Prop({ required: true })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

// Hooks
AddressSchema.pre<AddressDocument>('save', function (next) {
  this.province = this.province?.trim();
  this.district = this.district?.trim();
  this.ward = this.ward?.trim();
  this.address = this.address?.trim();
  this.country = this.country?.trim();
  this.zip = this.zip?.trim();
  next();
});
