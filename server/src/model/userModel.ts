import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";
const UserSchema: Schema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  passwd: { type: String, required: true },
  docs: [
    {
      docID: { type: Schema.Types.ObjectId, required: true },
    },
  ],
});

const User = mongoose.model("User", UserSchema);
export default User;
