import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";

function CustomerDetails() {
  const { customerId } = useParams();
  const { user } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [type, setType] = useState("credit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadTransactions = async () => {
    try {
      const list = await api.get(`/transactions?customerId=${customerId}`);
      setTransactions(list);
    } catch (err) {
      console.error("Transaction fetch error:", err);
      setError("Unable to load transactions.");
    }
  };

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user) return;

      try {
        const data = await api.get(`/customers/${customerId}`);
        setCustomer(data);
      } catch (err) {
        console.error(err);
        setError("Customer not found.");
      }
    };

    fetchCustomer();
  }, [customerId, user]);

  // Fetch transactions
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    api
      .get(`/transactions?customerId=${customerId}`)
      .then((list) => {
        if (!cancelled) setTransactions(list);
      })
      .catch((err) => {
        console.error("Transaction fetch error:", err);
        if (!cancelled) setError("Unable to load transactions.");
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, user]);

  // Calculate balance
  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayment = transactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalCredit - totalPayment;

  const resetTransactionForm = () => {
    setEditingTransactionId(null);
    setAmount("");
    setNote("");
    setType("credit");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !customer) {
      setError("Access denied.");
      return;
    }

    if (!editName.trim() || !editPhone.trim()) {
      setError("Please enter both name and phone number.");
      return;
    }

    try {
      const updated = await api.put(`/customers/${customerId}`, {
        name: editName.trim(),
        phone: editPhone.trim()
      });

      setCustomer(updated);
      setIsEditing(false);
      setSuccess("Customer details updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message);
    }
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!user || !editingTransactionId) {
      setError("Invalid transaction.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    try {
      await api.put(`/transactions/${editingTransactionId}`, {
        type,
        amount: numericAmount,
        date,
        note: note.trim()
      });

      resetTransactionForm();
      setSuccess("Transaction updated successfully!");
      await loadTransactions();
    } catch (err) {
      console.error("Update transaction error:", err);
      setError("Unable to update transaction.");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    if (!user) {
      setError("Please login first.");
      return;
    }

    try {
      await api.del(`/transactions/${transactionId}`);
      setSuccess("Transaction deleted successfully!");
      setError("");
      await loadTransactions();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Unable to delete transaction.");
    }
  };

  // Add transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!user || !customer) {
      setError("Customer not found or access denied.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/transactions", {
        customerId,
        type,
        amount: numericAmount,
        date,
        note: note.trim()
      });

      setAmount("");
      setNote("");
      setSuccess("Transaction recorded successfully!");
      await loadTransactions();
    } catch (err) {
      console.error("Transaction save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!customer && !error) {
    return <p>Loading customer...</p>;
  }

  if (!customer) {
    return (
      <div>
        <p>{error}</p>
        <Link to="/customers">Back to Customers</Link>
      </div>
    );
  }

  return (
    <div className="customer-details">
      <Link to="/customers">← Back to Customers</Link>

{/* Customer information */}
<section className="customer-profile">

  {isEditing ? (
    <form
      className="edit-customer-form"
      onSubmit={handleUpdateCustomer}
    >
      <h2>Edit Customer Details</h2>

      <input
        type="text"
        placeholder="Customer Name"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        required
      />

      <input
        type="tel"
        placeholder="Phone Number"
        value={editPhone}
        onChange={(e) => setEditPhone(e.target.value)}
        required
      />

      <div className="edit-actions">
        <button type="submit">Save Changes</button>

        <button
          type="button"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  ) : (
    <>
      <h1>{customer.name}</h1>
      <p>Phone: {customer.phone}</p>

      <button
        type="button"
        onClick={() => {
          setEditName(customer.name);
          setEditPhone(customer.phone);
          setIsEditing(true);
          setError("");
          setSuccess("");
        }}
      >
        Edit Details
      </button>
    </>
  )}

</section>

      <div className="balance-card">
        <h3>Outstanding Balance</h3>
        <h2>₹{balance.toFixed(2)}</h2>
      </div>

      <div className="transaction-summary">
        <p>Total Credit: ₹{totalCredit.toFixed(2)}</p>
        <p>Total Payments: ₹{totalPayment.toFixed(2)}</p>
      </div>

      <hr />

      <h2>Record Transaction</h2>

      <form
            onSubmit={
                editingTransactionId
                ? handleUpdateTransaction
                : handleAddTransaction
            }
            >
        <label>Transaction Type</label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="credit">Credit (Udhar)</option>
          <option value="payment">Payment (Paid)</option>
        </select>

        <input
          type="number"
          placeholder="Enter Amount"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

       <button type="submit" disabled={saving}>
  {editingTransactionId
    ? "Update Transaction"
    : "Save Transaction"}
</button>

    {editingTransactionId && (
    <button
        type="button"
        onClick={() => {
        setEditingTransactionId(null);
        setAmount("");
        setNote("");
        setType("credit");
        setDate(new Date().toISOString().split("T")[0]);
        }}
    >
        Cancel Edit
    </button>
    )}
      </form>

      {success && <p>{success}</p>}
      {error && <p>{error}</p>}

      <hr />

      <h2>Transaction History</h2>

      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        transactions.map((t) => (
          <div className="transaction-card"  key={t.id}>
            <h3>
              {t.type === "credit" ? "Credit (Udhar)" : "Payment"}
            </h3>

            <p>Amount: ₹{Number(t.amount).toFixed(2)}</p>
            <p>Date: {t.date}</p>
            {t.note && <p>Note: {t.note}</p>}

            <button
                type="button"
                onClick={() => {
                    setEditingTransactionId(t.id);
                    setType(t.type);
                    setAmount(String(t.amount));
                    setDate(t.date);
                    setNote(t.note || "");
                    setError("");
                    setSuccess("");
                }}
                >
                Edit Transaction
                </button>
            <button
                type="button"
                className="delete-transaction-button"
                onClick={() => handleDeleteTransaction(t.id)}
            >
                Delete Transaction
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default CustomerDetails;
