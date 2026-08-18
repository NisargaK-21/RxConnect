"use client";

import {
  acceptSubstitution,
  rejectSubstitution,
} from "@/services/order.service";
import { ICONS } from "@/lib/navigation";

export default function SubstitutionPanel({
  substitution,
  onResolved,
  onMessage,
}) {
  if (!substitution) return null;

  const raw = substitution.suggestion || substitution;
  const suggestionOptions = raw.suggestionOptions || [];

  const branchSuggestion =
    raw.branchSuggestion ||
    suggestionOptions.find((s) => s.type === "same_medicine_other_branch") ||
    (raw.branchId
      ? { branchId: raw.branchId, branchName: raw.branchName }
      : null);

  const medicineSuggestion =
    raw.medicineSuggestion ||
    suggestionOptions.find((s) => s.type === "substitute_same_branch");

  const medicineOtherBranchSuggestion =
    raw.medicineOtherBranchSuggestion ||
    suggestionOptions.find((s) => s.type === "substitute_other_branch");

  const orderId = substitution.orderId || raw.orderId;
  const orderItemId = substitution.orderItemId || raw.orderItemId;
  const originalBranchId = substitution.originalBranchId || raw.originalBranchId;
  const originalMedicineId = substitution.originalMedicineId || raw.originalMedicineId;

  const acceptChoice = async (branchId, medicineId) => {
    try {
      const data = await acceptSubstitution(orderId, {
        orderItemId,
        branchId,
        medicineId,
      });
      onMessage?.(data.message || "Substitution accepted.", "success");
      onResolved?.();
    } catch (err) {
      onMessage?.(
        err.response?.data?.message || "Failed to accept substitution.",
        "error"
      );
    }
  };

  const reject = async () => {
    try {
      const data = await rejectSubstitution(
        orderId,
        orderItemId
      );
      onMessage?.(data.message || "Order rejected.", "success");
      onResolved?.();
    } catch (err) {
      onMessage?.(
        err.response?.data?.message || "Failed to reject order.",
        "error"
      );
    }
  };

  return (
    <div className="mt-6 space-y-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm animate-fade-in-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
          <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.lowStock }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Medicine Out of Stock — Choose Substitution
          </h3>
          <p className="text-xs text-slate-500">
            Select an alternative fulfillment option below to continue.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {branchSuggestion && (
          <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Alternate Branch
              </span>
              <p className="mt-2 font-bold text-slate-900 text-sm">
                {branchSuggestion.branchName || `Branch #${branchSuggestion.branchId}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Stock: {branchSuggestion.availableQuantity || "Available"}
              </p>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 btn-press transition focus-ring"
              onClick={() =>
                acceptChoice(
                  branchSuggestion.branchId,
                  originalMedicineId
                )
              }
            >
              Use this branch
            </button>
          </div>
        )}

        {medicineSuggestion && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Generic Substitute
              </span>
              <p className="mt-2 font-bold text-slate-900 text-sm">
                {medicineSuggestion.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Price: ₹{medicineSuggestion.price} · Qty: {medicineSuggestion.availableQuantity || "In stock"}
              </p>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 btn-press transition focus-ring"
              onClick={() =>
                acceptChoice(
                  originalBranchId,
                  medicineSuggestion.id
                )
              }
            >
              Use substitute
            </button>
          </div>
        )}

        {medicineOtherBranchSuggestion && (
          <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Other Branch Generic
              </span>
              <p className="mt-2 font-bold text-slate-900 text-sm">
                {medicineOtherBranchSuggestion.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {medicineOtherBranchSuggestion.branchName} · ₹{medicineOtherBranchSuggestion.price}
              </p>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-purple-700 hover:to-pink-700 btn-press transition focus-ring"
              onClick={() =>
                acceptChoice(
                  medicineOtherBranchSuggestion.branchId,
                  medicineOtherBranchSuggestion.id
                )
              }
            >
              Use this option
            </button>
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={reject}
          className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 btn-press transition focus-ring"
        >
          Cancel Order
        </button>
      </div>
    </div>
  );
}

