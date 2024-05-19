import { Document, Types } from "mongoose";

export type Doctype = {
  docID: Types.ObjectId;
};

export interface IDoc extends Document {
  docId: string;
  title: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  userId: Types.ObjectId;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwd: string;
  docs: Doctype[];
}
