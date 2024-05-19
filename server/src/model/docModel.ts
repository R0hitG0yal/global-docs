import mongoose, { Schema } from "mongoose";
import { IDoc } from "../types";

const DocSchema: Schema = new Schema<IDoc>({
  docId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: "New Document",
  },
  data: {
    type: Object,
    required: true,
    default: [""],
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Document = mongoose.model("Document", DocSchema);
export default Document;