import mongoose from "mongoose";
import { applyJsonTransform } from "./toJSON.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

applyJsonTransform(userSchema);

export default mongoose.model("User", userSchema);
