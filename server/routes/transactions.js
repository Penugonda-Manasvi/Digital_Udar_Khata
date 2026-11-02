import { Router } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

const validId = (id) => mongoose.isValidObjectId(id);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readBody(body) {
  const type = body.type;
  const amount = Number(body.amount);
  const date = String(body.date || "");
  const note = String(body.note || "").trim();

  if (type !== "credit" && type !== "payment") {
    return { error: "Transaction type must be credit or payment." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }
  if (!DATE_RE.test(date)) {
    return { error: "Enter a valid date." };
  }
  return { type, amount, date, note };
}

// All transactions of the shopkeeper, or only one customer's with ?customerId=
router.get("/", async (req, res) => {
  try {
    const filter = { ownerId: req.userId };

    if (req.query.customerId) {
      if (!validId(req.query.customerId)) return res.json([]);
      filter.customerId = req.query.customerId;
    }

    const list = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load transactions." });
  }
});

router.post("/", async (req, res) => {
  const { customerId } = req.body;
  if (!validId(customerId)) {
    return res.status(400).json({ message: "Customer not found or access denied." });
  }

  const data = readBody(req.body);
  if (data.error) return res.status(400).json({ message: data.error });

  try {
    const customer = await Customer.findOne({ _id: customerId, ownerId: req.userId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found or access denied." });
    }

    const transaction = await Transaction.create({
      ...data,
      customerId,
      ownerId: req.userId,
    });
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to save transaction." });
  }
});

router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(404).json({ message: "Transaction not found." });
  }
  const data = readBody(req.body);
  if (data.error) return res.status(400).json({ message: data.error });

  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      data,
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: "Transaction not found." });
    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to update transaction." });
  }
});

router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(404).json({ message: "Transaction not found." });
  }
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found." });
    res.json({ message: "Transaction deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to delete transaction." });
  }
});

export default router;
