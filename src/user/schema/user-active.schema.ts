import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../shared/schema/base.schema';

export type UserActiveDocument = UserActives & Document;

@Schema()
export class UserActives extends BaseSchema {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  mobilePhone: string;

  @Prop({
    index: true,
    uppercase: true,
    trim: true,
  })
  mobilePhoneCode: string;

  @Prop({ required: true, default: 0, index: true })
  status: number;

  @Prop({
    required: true,
    lowercase: true,
    index: true,
  })
  smsCode: string;

  @Prop({ required: false })
  activeLink?: string;

  @Prop({ required: true, default: 120 })
  codeExpiredSecond?: number;
}

export const UserActiveSchema = SchemaFactory.createForClass(UserActives);

// Hooks
UserActiveSchema.pre<UserActiveDocument>('save', function (next) {
  this.smsCode = this.smsCode.toLowerCase();
  next();
});
