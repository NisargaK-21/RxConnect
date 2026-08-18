"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";
import SubstitutionDrawer from "@/components/SubstitutionDrawer";
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

  const [medicineId, setMedicineId] = useState(Number(searchParams.get("medicineId") || 0));
  const [branchId, setBranchId] = useState(Number(searchParams.get("branchId") || 1));
  const customerId = user?.id || 1;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [substitution, setSubstitution] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const placeOrder = async (overrideBranchId = null, overrideMedicineId = null) => {
    const activeBranch = overrideBranchId ?? branchId ?? 1;
    const activeMedicine = overrideMedicineId ?? medicineId;

    if (quantity < 1) {
      toast("Quantity should be at least 1", { variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/orders", {
        customerId,
        branchId: activeBranch,
        items: [
          {
            medicineId: activeMedicine,
            quantity,
          },
        ],
      });

      const data = response.data;
      if (data) {
        toast("Order placed successfully!", { variant: "success" });
        setIsDrawerOpen(false);
        setSubstitution(null);
        setTimeout(() => router.push(`/order-tracking`), 700);
      }
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};

      if (status === 409 && data.substitutionRequired) {
        const rawSuggestion = data.suggestion || {
          branchSuggestion: data.branchSuggestion,
          medicineSuggestion: data.medicineSuggestion,
          medicineOtherBranchSuggestion: data.medicineOtherBranchSuggestion,
          originalBranchId: data.originalBranchId || activeBranch,
          originalMedicineId: data.originalMedicineId || activeMedicine,
          branchId: data.branchId,
          branchName: data.branchName,
          suggestionOptions: data.suggestionOptions || [],
        };
        const suggestionOptions = rawSuggestion.suggestionOptions || [];

        const opt_same_branch = suggestionOptions.find((s) => s.type === "same_medicine_other_branch");
        const opt_sub_same = suggestionOptions.find((s) => s.type === "substitute_same_branch");
        const opt_sub_other = suggestionOptions.find((s) => s.type === "substitute_other_branch");

        const branchSuggestionFromPayload =
          rawSuggestion.branchSuggestion ||
          opt_same_branch ||
          (rawSuggestion.branchId
            ? {
                branchId: rawSuggestion.branchId,
                branchName: rawSuggestion.branchName,
              }
            : null);

        const suggestionData = {
          ...rawSuggestion,
          branchSuggestion: branchSuggestionFromPayload,
          medicineSuggestion: rawSuggestion.medicineSuggestion || opt_sub_same,
          medicineOtherBranchSuggestion: rawSuggestion.medicineOtherBranchSuggestion || opt_sub_other,
          branchId:
            rawSuggestion.branchId || branchSuggestionFromPayload?.branchId || opt_sub_other?.branchId,
          branchName:
            rawSuggestion.branchName || branchSuggestionFromPayload?.branchName || opt_sub_other?.branchName,
          suggestionOptions,
        };

        setSubstitution(suggestionData);
        setIsDrawerOpen(true);
        toast(data.message || "Stock unavailable. Choose a substitution option.", {
          variant: "warning",
        });
      } else {
        toast(data?.message || "Failed to place order", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  function handleSelectBranch(targetBranchId) {
    const bId = Number(targetBranchId);
    if (!Number.isNaN(bId)) {
      setBranchId(bId);
      setIsDrawerOpen(false);
      toast(`Switched branch to #${bId}. Submitting order...`, { variant: "info" });
      placeOrder(bId, medicineId);
    }
  }

  function handleSelectSubstitute(origBranchId, subMedicine) {
    if (!subMedicine) return;
    setMedicineId(subMedicine.id);
    setIsDrawerOpen(false);
    toast(`Using substitute (${subMedicine.name}). Submitting order...`, { variant: "info" });
    placeOrder(branchId, subMedicine.id);
  }

  function handleSelectOtherBranchSubstitute(altBranchId, subMedicine) {
    if (!subMedicine || !altBranchId) return;
    setBranchId(Number(altBranchId));
    setMedicineId(subMedicine.id);
    setIsDrawerOpen(false);
    toast(`Using ${subMedicine.name} at Branch #${altBranchId}. Submitting...`, { variant: "info" });
    placeOrder(Number(altBranchId), subMedicine.id);
  }

  return (
    <AppShell activeRoute="/orders">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span
            className="w-5 h-5 text-teal-600"
            dangerouslySetInnerHTML={{ __html: ICONS.orders }}
          />
          Confirm Order
        </h1>

        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold uppercase tracking-wider">Medicine ID</span>
            <span className="font-mono font-bold text-slate-900">#{medicineId || "Not specified"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold uppercase tracking-wider">Branch ID</span>
            <span className="font-mono font-bold text-slate-900">#{branchId || "Main Branch"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold uppercase tracking-wider">Customer ID</span>
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
            className="input-field w-full text-sm font-bold"
          />
        </div>

        <button
          onClick={() => placeOrder()}
          disabled={loading}
          className="w-full py-3.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700 btn-press transition disabled:opacity-50"
        >
          {loading ? "Placing Order..." : "Confirm & Place Order"}
        </button>

        {/* Responsive Substitution Drawer */}
        <SubstitutionDrawer
          isOpen={isDrawerOpen && Boolean(substitution)}
          onClose={() => setIsDrawerOpen(false)}
          substitution={substitution}
          onSelectBranch={handleSelectBranch}
          onSelectSubstitute={handleSelectSubstitute}
          onSelectOtherBranchSubstitute={handleSelectOtherBranchSubstitute}
          onReject={() => {
            setIsDrawerOpen(false);
            setSubstitution(null);
            toast("Order placement cancelled.", { variant: "info" });
          }}
          loading={loading}
        />
      </div>
    </AppShell>
  );
}