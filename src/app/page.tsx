"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  quantity?: number;
  isRecurring: boolean;
  taxPercent: number;
  discount: number;
  createdAt: string;
};

const categories = ["FOOD", "TRAVEL", "RENT", "UTILITIES", "OTHER"];

// Color scheme for categories
const categoryColors = {
  FOOD: "#FF6B6B",
  TRAVEL: "#4ECDC4", 
  RENT: "#45B7D1",
  UTILITIES: "#96CEB4",
  OTHER: "#FFEAA7"
};

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Filter and sort states
  const [filters, setFilters] = useState({
    category: "ALL",
    minAmount: "",
    maxAmount: "",
    isRecurring: "ALL",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
  });

  const [sorting, setSorting] = useState({
    field: "createdAt",
    order: "desc",
  });

  const [form, setForm] = useState({
    id: "",
    title: "",
    category: "FOOD",
    amount: 0,
    quantity: 1,
    isRecurring: false,
    taxPercent: 0,
    discount: 0,
  });

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  // Calculate effective amount for an expense
  const calculateEffectiveAmount = (amount: number, quantity: number = 1, taxPercent: number = 0, discount: number = 0) => {
    const subtotal = amount * quantity;
    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercent) / 100;
    return afterDiscount + taxAmount;
  };

  // Fetch logged-in user
  const fetchUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
    setLoading(false);
  };

  const fetchExpenses = useCallback(async () => {
  const params = new URLSearchParams();

  if (filters.category !== "ALL") params.append("category", filters.category);
  if (filters.minAmount) params.append("minAmount", filters.minAmount);
  if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
  params.append("sortBy", sorting.field);
  params.append("order", sorting.order);

  const res = await fetch(`/api/expenses?${params}`);
  if (res.ok) {
    const data = await res.json();
    setExpenses(data);
  }
}, [filters, sorting]);

// Fetch user on mount
useEffect(() => {
  fetchUser();
}, []);

// Fetch expenses when user, filters, or sorting change
useEffect(() => {
  if (user) fetchExpenses();
}, [user, fetchExpenses]);

// Logout handler
const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  setUser(null);
  setExpenses([]);
};

// Login handler
const handleLogin = async () => {
  setError(null);

  if (!credentials.username || !credentials.password) {
    setError("Please fill in all fields");
    return;
  }

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json();
    setError(err.error || "Login failed");
    return;
  }

  setCredentials({ username: "", password: "" });
  fetchUser();
};

// Signup handler
const handleSignup = async () => {
  setError(null);

  if (!credentials.username || !credentials.password) {
    setError("Please fill in all fields");
    return;
  }

  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json();
    setError(err.error || "Signup failed");
    return;
  }

  alert("Signup successful! Please login.");
  setCredentials({ username: "", password: "" });
  setIsSignup(false);
};

// Submit expense
const handleSubmitExpense = async () => {
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
      quantity: 1,
      isRecurring: false,
      taxPercent: 0,
      discount: 0,
    });
    fetchExpenses();
  }
};

// Edit and Delete handlers
const handleEdit = (exp: Expense) => setForm({ ...exp, quantity: exp.quantity ?? 1 });
const handleDelete = async (id: string) => {
  if (!confirm("Are you sure?")) return;
  const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  if (res.ok) fetchExpenses();
};
  // Filter expenses locally (for client-side filtering that API doesn't support)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Search term filter
      if (filters.searchTerm && !exp.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Recurring filter
      if (filters.isRecurring !== "ALL") {
        const isRecurringFilter = filters.isRecurring === "true";
        if (exp.isRecurring !== isRecurringFilter) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const expDate = new Date(exp.createdAt);
        if (filters.dateFrom && expDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && expDate > new Date(filters.dateTo + "T23:59:59")) {
          return false;
        }
      }
      
      return true;
    });
  }, [expenses, filters]);

  // Category-wise totals (using filtered expenses and effective amounts)
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { original: number; effective: number }> = {};
    
    // Initialize all categories
    for (const cat of categories) {
      totals[cat] = { original: 0, effective: 0 };
    }
    
    // Calculate totals
    filteredExpenses.forEach((exp) => {
      const originalAmount = exp.amount * (exp.quantity || 1);
      const effectiveAmount = calculateEffectiveAmount(exp.amount, exp.quantity || 1, exp.taxPercent, exp.discount);
      
      totals[exp.category].original += originalAmount;
      totals[exp.category].effective += effectiveAmount;
    });
    
    return totals;
  }, [filteredExpenses]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return categories
      .map(category => ({
        name: category,
        value: categoryTotals[category].effective,
        color: categoryColors[category as keyof typeof categoryColors]
      }))
      .filter(item => item.value > 0);
  }, [categoryTotals]);

  // Grand totals
  const grandTotals = useMemo(() => {
    return Object.values(categoryTotals).reduce(
      (acc, curr) => ({
        original: acc.original + curr.original,
        effective: acc.effective + curr.effective,
      }),
      { original: 0, effective: 0 }
    );
  }, [categoryTotals]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: "ALL",
      minAmount: "",
      maxAmount: "",
      isRecurring: "ALL",
      dateFrom: "",
      dateTo: "",
      searchTerm: "",
    });
  };

  // Handle sort change
  const handleSort = (field: string) => {
    setSorting(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  if (loading) return <p className="p-8">Loading...</p>;

  const themeClasses = darkMode ? "bg-gray-900 text-white" : "bg-blue-50 text-gray-900";

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${themeClasses}`}>
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-8 rounded-lg shadow-lg w-full max-w-sm`}>
          <h2 className="text-2xl font-bold mb-6 text-center">{isSignup ? "Sign Up" : "Login"}</h2>
          <input
            placeholder="Username"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            className={`w-full mb-4 p-2 border border-gray-400 rounded ${darkMode ? 'text-white bg-gray-700' : 'text-gray-900 bg-white'}`}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className={`w-full mb-4 p-2 border border-gray-400 rounded ${darkMode ? 'text-white bg-gray-700' : 'text-gray-900 bg-white'}`}
            required
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            onClick={isSignup ? handleSignup : handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
          <p className="text-center mt-4">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
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
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-screen ${themeClasses} transition-colors duration-300`}>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome, {user.username}
        </h1>
        <div className="flex gap-4 items-center">
          <button onClick={handleLogout} className="flex items-center gap-1 bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700 transition-all duration-200">
            <LogOut size={16} /> Logout
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">
            {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Expense Form */}
        <div className="lg:col-span-2">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">{form.id ? "Edit Expense" : "Add Expense"}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className={`p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              
              <select
                className={`p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Unit Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tax %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
                  value={form.taxPercent}
                  onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Discount %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                />
              </div>
            </div>

            <label className="mt-4 mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              Recurring Expense
            </label>

            {/* Effective Amount Preview */}
            {form.amount > 0 && (
              <div className={`mb-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg border-l-4 border-blue-500`}>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Calculation Preview:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Unit Price: ${form.amount.toFixed(2)} × {form.quantity} = ${(form.amount * form.quantity).toFixed(2)}</p>
                {form.discount > 0 && (
                  <p className="text-xs text-green-600">Discount ({form.discount}%): -${((form.amount * form.quantity * form.discount) / 100).toFixed(2)}</p>
                )}
                {form.taxPercent > 0 && (
                  <p className="text-xs text-red-600">Tax ({form.taxPercent}%): +${(((form.amount * form.quantity) - ((form.amount * form.quantity * form.discount) / 100)) * form.taxPercent / 100).toFixed(2)}</p>
                )}
                <p className="text-sm font-bold text-green-600 mt-2">Effective Amount: ${calculateEffectiveAmount(form.amount, form.quantity, form.taxPercent, form.discount).toFixed(2)}</p>
              </div>
            )}

            <button 
              onClick={handleSubmitExpense} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              {form.id ? "Update" : "Add"} Expense
            </button>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
          <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Expense Breakdown</h2>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
  `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No expenses to display</p>
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{backgroundColor: item.color}}
                ></div>
                <span className="text-sm">{item.name}: ${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 mb-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
        <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Filters & Search</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Search Title</label>
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* Amount Range */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Min Amount</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Max Amount</label>
            <input
              type="number"
              step="0.01"
              placeholder="999999.99"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Recurring Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Recurring</label>
            <select
              value={filters.isRecurring}
              onChange={(e) => setFilters({ ...filters, isRecurring: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            >
              <option value="ALL">All</option>
              <option value="true">Recurring Only</option>
              <option value="false">One-time Only</option>
            </select>
          </div>
          
          {/* Date Range */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white'}`}
            />
          </div>
          
          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto mb-8">
        <table className={`w-full table-auto border-collapse rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th 
                className="px-4 py-3 text-left cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                onClick={() => handleSort("title")}
              >
                Title {sorting.field === "title" && (sorting.order === "asc" ? "↑" : "↓")}
              </th>
              <th 
                className="px-4 py-3 text-left cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                onClick={() => handleSort("category")}
              >
                Category {sorting.field === "category" && (sorting.order === "asc" ? "↑" : "↓")}
              </th>
              <th 
                className="px-4 py-3 text-right cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                onClick={() => handleSort("amount")}
              >
                Unit Price {sorting.field === "amount" && (sorting.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">Tax %</th>
              <th className="px-4 py-3 text-right">Discount %</th>
              <th className="px-4 py-3 text-right">Effective Amount</th>
              <th 
                className="px-4 py-3 text-center cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                onClick={() => handleSort("isRecurring")}
              >
                Recurring {sorting.field === "isRecurring" && (sorting.order === "asc" ? "↑" : "↓")}
              </th>
              <th 
                className="px-4 py-3 text-center cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                onClick={() => handleSort("createdAt")}
              >
                Date {sorting.field === "createdAt" && (sorting.order === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp) => {
              const quantity = exp.quantity || 1;
              const subtotal = exp.amount * quantity;
              const effectiveAmount = calculateEffectiveAmount(exp.amount, quantity, exp.taxPercent, exp.discount);
              
              return (
                <tr key={exp.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-300 hover:bg-blue-50'} transition-colors duration-200`}>
                  <td className="px-4 py-3">{exp.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: `${categoryColors[exp.category as keyof typeof categoryColors]}20`, color: categoryColors[exp.category as keyof typeof categoryColors]}}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">${Number(exp.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{quantity}</td>
                  <td className="px-4 py-3 text-right">${subtotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{Number(exp.taxPercent || 0)}%</td>
                  <td className="px-4 py-3 text-right">{Number(exp.discount || 0)}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">${effectiveAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${exp.isRecurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {exp.isRecurring ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{new Date(exp.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(exp)} 
                        className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500 transition-all duration-200 text-black text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="bg-red-500 px-3 py-1 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Totals */}
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
          <h2 className="text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">Category Breakdown</h2>
          {categories.map((cat) => (
            <div key={cat} className={`mb-3 p-3 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{backgroundColor: categoryColors[cat as keyof typeof categoryColors]}}
                  ></div>
                  <span className="font-medium">{cat}</span>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Original:</span>
                  <span>${categoryTotals[cat].original.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Effective:</span>
                  <span>${categoryTotals[cat].effective.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Savings:</span>
                  <span className={categoryTotals[cat].original - categoryTotals[cat].effective >= 0 ? "text-green-500" : "text-red-500"}>
                    ${(categoryTotals[cat].original - categoryTotals[cat].effective).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
          <h2 className="text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">Total Summary</h2>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg">Original Total:</span>
                <span className="text-xl font-bold">${grandTotals.original.toFixed(2)}</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg">Effective Total:</span>
                <span className="text-xl font-bold text-green-600">${grandTotals.effective.toFixed(2)}</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg">Net Savings:</span>
                <span className={`text-xl font-bold ${grandTotals.original - grandTotals.effective >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${(grandTotals.original - grandTotals.effective).toFixed(2)}
                </span>
              </div>
            </div>
            <div className={`text-sm p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="font-medium">{filteredExpenses.length}</span>
              </p>
              <p className="flex justify-between">
                <span>Recurring Expenses:</span>
                <span className="font-medium">{filteredExpenses.filter(e => e.isRecurring).length}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}