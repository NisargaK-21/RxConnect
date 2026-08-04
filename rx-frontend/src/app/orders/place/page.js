"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getUser } from "@/utils/auth";
import { toast } from "@/components/Toast";
import { ICONS } from "@/lib/navigation";

export default function PlaceOrderPage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist"]}>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading order form...</div>}>
        <PlaceOrderInner />
      </Suspense>
    </RequireAuth>
  );
}

function PlaceOrderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = getUser();

  const medicineId = Number(searchParams.get("medicineId") || 0);
  const branchId = Number(searchParams.get("branchId") || 0);
  const customerId = user?.id || 1;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (quantity < 1) {
      toast("Quantity should be at least 1", { variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/orders", {
        customerId,
        branchId: branchId || 1,
        items: [
          {
            medicineId,
            quantity,
          },
        ],
      });

      const data = response.data;
      if (data) {
        toast("Order placed successfully!", { variant: "success" });
        setTimeout(() => router.push(`/order-tracking`), 700);
      }
    } catch (error) {
      if (error?.response?.status === 409 && error.response.data?.substitutionRequired) {
        localStorage.setItem("substitutionData", JSON.stringify(error.response.data));
        router.push("/orders/substitution");
      } else {
        toast(error?.response?.data?.message || "Failed to place order", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeRoute="/orders">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.orders }} />
          Confirm Order
        </h1>

        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Medicine ID</span>
            <span className="font-mono font-bold text-slate-900">#{medicineId || "Not specified"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Branch ID</span>
            <span className="font-mono font-bold text-slate-900">#{branchId || "Main Branch"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer ID</span>
            <span className="font-mono font-bold text-slate-900">#{customerId}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="input-field w-full"
          />
        </div>

        <button
          onClick={placeOrder}
          disabled={loading}
          className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition disabled:opacity-50"
        >
          {loading ? "Placing Order..." : "Confirm & Place Order"}
        </button>
      </div>
    </AppShell>
  );
}