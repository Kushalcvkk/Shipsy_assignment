"use client";

import { useEffect, useState, useMemo } from "react";
import { Sun, Moon, LogOut } from "lucide-react";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  isRecurring: boolean;
  taxPercent: number;
  discount: number;
  createdAt: string;
};

const categories = ["FOOD", "TRAVEL", "RENT", "UTILITIES", "OTHER"];

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [form, setForm] = useState({
    id: "",
    title: "",
    category: "FOOD",
    amount: 0,
    isRecurring: false,
    taxPercent: 0,
    discount: 0,
  });

  // Fetch logged-in user
  const fetchUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
    setLoading(false);
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) {
      const data = await res.json();
      setExpenses(data);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user]);

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setExpenses([]);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Login failed");
      return;
    }

    fetchUser();
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Signup failed");
      return;
    }

    alert("Signup successful! Please login.");
    setIsSignup(false);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/expenses/${form.id}` : "/api/expenses";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({
        id: "",
        title: "",
        category: "FOOD",
        amount: 0,
        isRecurring: false,
        taxPercent: 0,
        discount: 0,
      });
      fetchExpenses();
    }
  };

  const handleEdit = (exp: Expense) => setForm({ ...exp });
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) fetchExpenses();
  };

  // Category-wise totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let cat of categories) totals[cat] = 0;
    expenses.forEach((exp) => {
      totals[exp.category] += exp.amount;
    });
    return totals;
  }, [expenses]);

  if (loading) return <p className="p-8">Loading...</p>;

  const themeClasses = darkMode ? "bg-black text-white" : "bg-blue-200 text-black";

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${themeClasses}`}>
        <form
          onSubmit={isSignup ? handleSignup : handleLogin}
          className={`bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-sm`}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">{isSignup ? "Sign Up" : "Login"}</h2>
          <input
            name="username"
            placeholder="Username"
            className="w-full mb-4 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full mb-4 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
            required
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
          <p className="text-center mt-4">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError(null);
              }}
              className="text-blue-500 underline"
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
          <div className="flex justify-center mt-4 gap-4">
            <button onClick={() => setDarkMode(!darkMode)} type="button">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-screen ${themeClasses} transition-colors duration-300`}>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.username}</h1>
        <div className="flex gap-4 items-center">
          <button onClick={handleLogout} className="flex items-center gap-1 bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700">
            <LogOut size={16} /> Logout
          </button>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-800" />}
          </button>
        </div>
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmitExpense} className="bg-white dark:bg-gray-900 p-6 mb-6 rounded-lg shadow max-w-md">
        <h2 className="text-xl font-semibold mb-4">{form.id ? "Edit Expense" : "Add Expense"}</h2>
        <input
          className="w-full mb-2 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select
          className="w-full mb-2 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="block mb-1">Amount</label>
        <input
          type="number"
          className="w-full mb-2 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
        />

        <label className="block mb-1">Tax %</label>
        <input
          type="number"
          className="w-full mb-2 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
          value={form.taxPercent}
          onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
        />

        <label className="block mb-1">Discount</label>
        <input
          type="number"
          className="w-full mb-2 p-2 border border-gray-400 rounded text-black dark:text-white dark:bg-gray-800"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
        />

        <label className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
          />
          Recurring
        </label>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          {form.id ? "Update" : "Add"}
        </button>
      </form>

      {/* Expenses Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-blue-500 dark:bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-center">Recurring</th>
              <th className="px-4 py-2 text-right">Tax %</th>
              <th className="px-4 py-2 text-right">Discount</th>
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-b border-gray-300 dark:border-gray-700">
                <td className="px-4 py-2">{exp.title}</td>
                <td className="px-4 py-2">{exp.category}</td>
                <td className="px-4 py-2 text-right">{exp.amount}</td>
                <td className="px-4 py-2 text-center">{exp.isRecurring ? "Yes" : "No"}</td>
                <td className="px-4 py-2 text-right">{exp.taxPercent}</td>
                <td className="px-4 py-2 text-right">{exp.discount}</td>
                <td className="px-4 py-2 text-center">{new Date(exp.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 flex justify-center gap-2">
                  <button onClick={() => handleEdit(exp)} className="bg-yellow-400 px-2 rounded hover:bg-yellow-500 transition">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="bg-red-500 px-2 text-white rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Totals */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow max-w-md">
        <h2 className="text-lg font-bold mb-4">Total Expenses by Category</h2>
        {categories.map((cat) => (
          <div key={cat} className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-1">
            <span>{cat}</span>
            <span className="font-semibold">{categoryTotals[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
