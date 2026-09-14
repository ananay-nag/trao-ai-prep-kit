import mongoose, { Schema, Document } from 'mongoose';
import { Kit } from '../../types/kit.js';

export interface IKitDocument extends Document {
  userId?: string;
  data: Kit;
  title: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
}

const KitDocumentSchema = new Schema<IKitDocument>(
  {
    userId: { type: String, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true }
  },
  { timestamps: true }
);

export const KitModel = mongoose.model<IKitDocument>('Kit', KitDocumentSchema);
