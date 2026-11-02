import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";

function Customers() {
  const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      const list = await api.get("/customers");
      setCustomers(list);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load customers.");
    }
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    api
      .get("/customers")
      .then((list) => {
        if (!cancelled) setCustomers(list);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        if (!cancelled) setError("Unable to load customers.");
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in first.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/customers", {
        name: name.trim(),
        phone: phone.trim()
      });

      setName("");
      setPhone("");
      setSuccess("Customer added successfully!");
      await loadCustomers();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone?.includes(search)
  );

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

      {/* Main content */}
      <div className="dashboard-content">

        <header className="dashboard-header">
          <div>
            <h1>Customers</h1>
            <p>Manage and keep track of your shop customers.</p>
          </div>
          <span className="user-avatar">U</span>
        </header>

        <main className="customers-main">

          {/* Add customer form */}
          <section className="add-customer-section">
            <div className="section-heading">
              <h2>Add New Customer</h2>
              <p>Enter the details of your new customer.</p>
            </div>

            <form className="customer-form" onSubmit={handleAddCustomer}>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "+ Add Customer"}
              </button>
            </form>

            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
          </section>

          {/* Customer list */}
          <section className="customers-list-section">
            <div className="customer-list-heading">
              <div>
                <h2>All Customers</h2>
                <p>{customers.length} customers registered</p>
              </div>

              <input
                className="customer-search"
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="empty-customers">
                <h3>No customers found</h3>
                <p>Try another search or add a new customer.</p>
              </div>
            ) : (
              <div className="customer-list">
                {filteredCustomers.map((customer) => (
                  <Link
                    to={`/customers/${customer.id}`}
                    className="customer-card"
                    key={customer.id}
                  >
                    <div className="customer-avatar">
                      {customer.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="customer-info">
                      <h3>{customer.name}</h3>
                      <p>{customer.phone}</p>
                    </div>

                    <span className="customer-arrow">→</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}

export default Customers;
