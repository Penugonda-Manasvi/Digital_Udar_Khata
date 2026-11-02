import { Router } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

const validId = (id) => mongoose.isValidObjectId(id);

function readBody(body) {
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  if (!name || !phone) return { error: "Please enter both name and phone number." };
  return { name, phone };
}

// List all customers of the logged-in shopkeeper
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find({ ownerId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load customers." });
  }
});

router.post("/", async (req, res) => {
  const data = readBody(req.body);
  if (data.error) return res.status(400).json({ message: data.error });

  try {
    const customer = await Customer.create({
      name: data.name,
      phone: data.phone,
      ownerId: req.userId,
    });
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to save customer." });
  }
});

router.get("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(404).json({ message: "Customer not found." });
  }
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load customer." });
  }
});

router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(404).json({ message: "Customer not found." });
  }
  const data = readBody(req.body);
  if (data.error) return res.status(400).json({ message: data.error });

  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { name: data.name, phone: data.phone },
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to update customer." });
  }
});

// Deletes the customer and all of their transactions
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(404).json({ message: "Customer not found." });
  }
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    await Transaction.deleteMany({ customerId: customer._id, ownerId: req.userId });
    res.json({ message: "Customer deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to delete customer." });
  }
});

export default router;
