"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { getUser } from "@/utils/auth";
import { toast } from "@/components/Toast";

export default function SubstitutionPage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist"]}>
      <SubstitutionContent />
    </RequireAuth>
  );
}

function SubstitutionContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [substitution, setSubstitution] = useState(null);
  const user = getUser();
  const customerId = user?.id;

  const normalizedSuggestion = (sub) => {
    if (!sub) return {};
    if (sub.branchSuggestion || sub.medicineSuggestion || sub.medicineOtherBranchSuggestion) {
      return sub;
    }
    const branchSuggestion = sub.suggestionOptions?.find((opt) => opt.type === "same_medicine_other_branch");
    const medicineSuggestion = sub.suggestionOptions?.find((opt) => opt.type === "substitute_same_branch");
    const medicineOtherBranchSuggestion = sub.suggestionOptions?.find((opt) => opt.type === "substitute_other_branch");
    return {
      ...sub,
      branchSuggestion,
      medicineSuggestion,
      medicineOtherBranchSuggestion,
    };
  };

  useEffect(() => {
    const data = localStorage.getItem("substitutionData");
    if (data) {
      try {
        setSubstitution(JSON.parse(data));
      } catch (err) {
        console.error("Failed to parse substitution data", err);
      }
    }
  }, []);

  const acceptChoice = async (selectedBranchId, selectedMedicineId) => {
    if (!substitution) return;

    setLoading(true);
    try {
      const branchIdNumber = Number(selectedBranchId);
      const medicineIdNumber = Number(selectedMedicineId);

      if (!Number.isFinite(branchIdNumber) || !Number.isFinite(medicineIdNumber)) {
        toast("Invalid substitution choice selected.", { variant: "error" });
        return;
      }

      const response = await api.patch(
        `/orders/${substitution.orderId}/accept-substitution`,
        {
          orderItemId: Number(substitution.orderItemId),
          branchId: branchIdNumber,
          medicineId: medicineIdNumber,
        }
      );

      if (response.status === 200) {
        toast("Substitution accepted successfully!", { variant: "success" });
        localStorage.removeItem("substitutionData");
        router.push("/order-tracking");
      } else {
        toast(response.data?.message || "Failed to accept substitution.", { variant: "error" });
      }
    } catch (error) {
      console.error(error);
      toast(error?.response?.data?.message || "Unable to connect to the server.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const rejectSubstitution = async () => {
    if (!substitution) return;

    setLoading(true);
    try {
      const response = await api.patch(
        `/orders/${substitution.orderId}/reject-substitution`,
        {
          orderItemId: substitution.orderItemId,
        }
      );

      if (response.status === 200) {
        toast("Substitution rejected. Order item removed.", { variant: "info" });
        localStorage.removeItem("substitutionData");
        router.push("/order-tracking");
      } else {
        toast(response.data?.message || "Failed to reject substitution.", { variant: "error" });
      }
    } catch (error) {
      console.error(error);
      toast(error?.response?.data?.message || "Unable to connect to the server.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const norm = normalizedSuggestion(substitution);

  return (
    <AppShell activeRoute="/catalog">
      <div className="animate-fade-in-up max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.lowStock }} />
              Item Out of Stock at Assigned Branch
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Medicine Substitution Options
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Please choose a substitute medicine or alternative branch to fulfill your order.
            </p>
          </div>
        </div>

        {!substitution ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
              <span className="w-8 h-8" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No pending substitutions</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              All items in your cart and orders are in stock or processed.
            </p>
            <button
              type="button"
              onClick={() => router.push("/catalog")}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
            >
              Browse Medicine Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-5">
              {/* Option 1: Same Medicine, Alternate Branch */}
              {norm.branchSuggestion && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between card-hover relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 opacity-60" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                      <span className="w-6 h-6" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
                    </div>
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Option 1</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Same Medicine at Another Branch</h3>
                    
                    <div className="space-y-2 text-xs text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Branch:</span>
                        <span className="font-bold text-slate-900">{norm.branchSuggestion.branchName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Available Stock:</span>
                        <span className="font-bold text-emerald-600">{norm.branchSuggestion.availableQuantity} units</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => acceptChoice(norm.branchSuggestion.branchId, substitution.originalMedicineId)}
                    disabled={loading}
                    className="relative z-10 w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 btn-press transition focus-ring disabled:opacity-60"
                  >
                    Select Alternate Branch
                  </button>
                </div>
              )}

              {/* Option 2: Substitute Medicine, Same Branch */}
              {norm.medicineSuggestion && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between card-hover relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-bl-full -z-0 opacity-60" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                      <span className="w-6 h-6" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
                    </div>
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Option 2</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Substitute Medicine (Same Branch)</h3>

                    <div className="space-y-2 text-xs text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Medicine:</span>
                        <span className="font-bold text-slate-900">{norm.medicineSuggestion.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Price:</span>
                        <span className="font-bold text-slate-900">₹{norm.medicineSuggestion.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Available Stock:</span>
                        <span className="font-bold text-emerald-600">{norm.medicineSuggestion.availableQuantity} units</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => acceptChoice(substitution.originalBranchId, norm.medicineSuggestion.id)}
                    disabled={loading}
                    className="relative z-10 w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-teal-500/25 btn-press transition focus-ring disabled:opacity-60"
                  >
                    Use Substitute Medicine
                  </button>
                </div>
              )}

              {/* Option 3: Substitute Medicine, Alternate Branch */}
              {norm.medicineOtherBranchSuggestion && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between card-hover relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 rounded-bl-full -z-0 opacity-60" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
                      <span className="w-6 h-6" dangerouslySetInnerHTML={{ __html: ICONS.catalog }} />
                    </div>
                    <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Option 3</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Substitute at Another Branch</h3>

                    <div className="space-y-2 text-xs text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Medicine:</span>
                        <span className="font-bold text-slate-900">{norm.medicineOtherBranchSuggestion.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Branch:</span>
                        <span className="font-bold text-slate-900">{norm.medicineOtherBranchSuggestion.branchName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Price:</span>
                        <span className="font-bold text-slate-900">₹{norm.medicineOtherBranchSuggestion.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Available Stock:</span>
                        <span className="font-bold text-emerald-600">{norm.medicineOtherBranchSuggestion.availableQuantity} units</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => acceptChoice(norm.medicineOtherBranchSuggestion.branchId, norm.medicineOtherBranchSuggestion.id)}
                    disabled={loading}
                    className="relative z-10 w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 btn-press transition focus-ring disabled:opacity-60"
                  >
                    Select Option 3
                  </button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-center">
              <button
                type="button"
                onClick={rejectSubstitution}
                disabled={loading}
                className="px-6 py-3 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 btn-press transition focus-ring"
              >
                Reject Substitution & Remove Item
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}