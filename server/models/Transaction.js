import mongoose from "mongoose";
import { applyJsonTransform } from "./toJSON.js";

const transactionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["credit", "payment"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    // kept as "YYYY-MM-DD" text, exactly like the old Firestore version
    date: { type: String, required: true },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

applyJsonTransform(transactionSchema);

export default mongoose.model("Transaction", transactionSchema);
