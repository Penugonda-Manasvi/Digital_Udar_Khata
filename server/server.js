import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import transactionRoutes from "./routes/transactions.js";

const { MONGODB_URI, JWT_SECRET } = process.env;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI || !JWT_SECRET) {
  console.error(
    "Missing MONGODB_URI or JWT_SECRET. Copy server/.env.example to server/.env and fill it in."
  );
  process.exit(1);
}

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "Route not found." }));

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error(
      "Check: 1) username/password in MONGODB_URI, 2) Atlas > Network Access allows your IP (or 0.0.0.0/0 for testing)."
    );
    process.exit(1);
  });
