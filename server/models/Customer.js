import mongoose from "mongoose";
import { applyJsonTransform } from "./toJSON.js";

const customerSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

applyJsonTransform(customerSchema);

export default mongoose.model("Customer", customerSchema);
