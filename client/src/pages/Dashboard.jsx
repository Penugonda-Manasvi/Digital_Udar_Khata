import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [customerList, transactionList] = await Promise.all([
          api.get("/customers"),
          api.get("/transactions")
        ]);

        if (cancelled) return;
        setCustomers(customerList);
        setTransactions(transactionList);
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (!cancelled) setError("Unable to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const customerBalances = customers.map((customer) => {
    const customerTransactions = transactions.filter(
      (transaction) => transaction.customerId === customer.id
    );

    const credit = customerTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const payment = customerTransactions
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      ...customer,
      balance: credit - payment
    };
  });

  const totalOutstanding = customerBalances.reduce(
    (sum, customer) => sum + customer.balance,
    0
  );

  const pendingCustomers = customerBalances.filter(
    (customer) => customer.balance > 0
  ).length;

  const topCustomers = [...customerBalances]
    .filter((customer) => customer.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">U</div>
          <h2>Udhar Khata</h2>
        </div>

        <p className="sidebar-label">MENU</p>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span>▦</span> Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span>♙</span> Customers
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="logout-button">
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main dashboard */}
      <div className="dashboard-content">

        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to your shop management dashboard!</p>
          </div>
          <span className="user-avatar">U</span>
        </header>

        <main className="dashboard-main">

          {error && <p className="dashboard-error">{error}</p>}

          {/* Statistics */}
          <div className="stats">
            <div className="stat-card">
              <p>Total Outstanding</p>
              <h2>₹{totalOutstanding.toFixed(2)}</h2>
            </div>

            <div className="stat-card">
              <p>Total Customers</p>
              <h2>{customers.length}</h2>
            </div>

            <div className="stat-card">
              <p>Customers with Pending Dues</p>
              <h2>{pendingCustomers}</h2>
            </div>

            <div className="stat-card">
              <p>Total Transactions</p>
              <h2>{transactions.length}</h2>
            </div>
          </div>

          {/* Dashboard sections */}
          <div className="dashboard-sections">

            <section className="dashboard-section">
              <h2>Top Customers by Dues</h2>

              {topCustomers.length === 0 ? (
                <p>No pending dues.</p>
              ) : (
                topCustomers.map((customer) => (
                  <div className="dashboard-item" key={customer.id}>
                    <div>
                      <h3>
                        <Link to={`/customers/${customer.id}`}>
                          {customer.name}
                        </Link>
                      </h3>
                      <p>{customer.phone}</p>
                    </div>

                    <strong>₹{customer.balance.toFixed(2)}</strong>
                  </div>
                ))
              )}
            </section>

            <section className="dashboard-section">
              <h2>Recent Transactions</h2>

              {recentTransactions.length === 0 ? (
                <p>No transactions yet.</p>
              ) : (
                recentTransactions.map((transaction) => {
                  const customer = customers.find(
                    (c) => c.id === transaction.customerId
                  );

                  return (
                    <div className="dashboard-item" key={transaction.id}>
                      <div>
                        <h3>{customer?.name || "Unknown Customer"}</h3>
                        <p>{transaction.date}</p>
                        {transaction.note && <p>{transaction.note}</p>}
                      </div>

                      <strong
                        className={
                          transaction.type === "credit"
                            ? "credit-amount"
                            : "payment-amount"
                        }
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        ₹{Number(transaction.amount).toFixed(2)}
                      </strong>
                    </div>
                  );
                })
              )}
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
