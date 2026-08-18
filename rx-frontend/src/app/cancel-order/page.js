"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getUser } from "@/utils/auth";
import { useToast } from "@/components/Toast";

export default function CancelOrderPage() {
  return (
    <RequireAuth>
      <CancelOrderContent />
    </RequireAuth>
  );
}

function CancelOrderContent() {
  const user = getUser();
  const { addToast } = useToast();
  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.id) {
      setCustomerId(String(user.id));
    }
  }, [user]);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!orderId || !customerId) {
      addToast("Please enter both Order ID and Customer ID.", "warning");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.patch(`/orders/${orderId}/cancel`, {
        customerId: Number(customerId),
      });

      const data = response.data;
      if (data.success) {
        addToast(data.message || "Order cancelled successfully!", "success");
        setMessage({ type: "success", text: data.message || "Order cancelled successfully." });
        setOrderId("");
      } else {
        addToast(data.message || "Could not cancel order.", "error");
        setMessage({ type: "error", text: data.message || "Could not cancel order." });
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to cancel order. Please verify details.";
      addToast(errMsg, "error");
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 border border-rose-100 shadow-inner">
              🚫
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cancel Order</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your Order ID and Customer ID to process cancellation.
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl mb-6 text-sm font-medium border flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <span>{message.type === "success" ? "✓" : "⚠️"}</span>
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleCancel} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Order ID
              </label>
              <input
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 102"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Customer ID
              </label>
              <input
                type="number"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. 1"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold text-sm shadow-lg shadow-rose-600/25 hover:from-rose-700 hover:to-red-700 disabled:opacity-60 transition"
            >
              {loading ? "Processing Cancellation..." : "Cancel Order"}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

