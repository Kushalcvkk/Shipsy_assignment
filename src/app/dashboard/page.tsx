"use client";

import { useEffect, useState } from "react";

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

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: "",
    title: "",
    category: "FOOD",
    amount: 0,
    isRecurring: false,
    taxPercent: 0,
    discount: 0,
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch("/api/expenses");
    if (res.ok) {
      setExpenses(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) fetchExpenses();
  };

  const handleEdit = (exp: Expense) => {
    setForm({ ...exp });
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 mb-6 rounded shadow max-w-md">
        <h2 className="text-xl mb-4">{form.id ? "Edit Expense" : "Add Expense"}</h2>
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <select
          className="w-full mb-2 p-2 border rounded"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          className="w-full mb-2 p-2 border rounded"
          placeholder="Amount"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
        />
        <input
          type="number"
          className="w-full mb-2 p-2 border rounded"
          placeholder="Tax %"
          value={form.taxPercent}
          onChange={e => setForm({ ...form, taxPercent: Number(e.target.value) })}
        />
        <input
          type="number"
          className="w-full mb-2 p-2 border rounded"
          placeholder="Discount"
          value={form.discount}
          onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
        />
        <label className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={e => setForm({ ...form, isRecurring: e.target.checked })}
          />
          Recurring
        </label>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          {form.id ? "Update" : "Add"}
        </button>
      </form>

      {/* Table */}
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-white rounded shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Recurring</th>
                <th className="px-4 py-2">Tax %</th>
                <th className="px-4 py-2">Discount</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} className="border-b">
                  <td className="px-4 py-2">{exp.title}</td>
                  <td className="px-4 py-2">{exp.category}</td>
                  <td className="px-4 py-2">{exp.amount}</td>
                  <td className="px-4 py-2">{exp.isRecurring ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{exp.taxPercent}</td>
                  <td className="px-4 py-2">{exp.discount}</td>
                  <td className="px-4 py-2">{new Date(exp.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="bg-yellow-400 px-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="bg-red-500 px-2 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
