"use client";

import {
  acceptSubstitution,
  rejectSubstitution,
} from "@/services/order.service";

export default function SubstitutionPanel({
  substitution,
  onResolved,
  onMessage,
}) {
  if (!substitution) return null;

  const acceptChoice = async (branchId, medicineId) => {
    try {
      const data = await acceptSubstitution(substitution.orderId, {
        orderItemId: substitution.orderItemId,
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
        substitution.orderId,
        substitution.orderItemId
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

  const { branchSuggestion, medicineSuggestion, medicineOtherBranchSuggestion } =
    substitution;

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="text-lg font-semibold text-amber-900">
        Medicine unavailable — choose an option
      </h3>

      {branchSuggestion && (
        <div className="rounded-lg border border-blue-200 bg-white p-4">
          <p className="font-medium text-blue-900">Same medicine, other branch</p>
          <p className="mt-1 text-sm text-slate-600">
            {branchSuggestion.branchName} · Qty{" "}
            {branchSuggestion.availableQuantity}
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() =>
              acceptChoice(
                branchSuggestion.branchId,
                substitution.originalMedicineId
              )
            }
          >
            Use this branch
          </button>
        </div>
      )}

      {medicineSuggestion && (
        <div className="rounded-lg border border-green-200 bg-white p-4">
          <p className="font-medium text-green-900">Substitute at same branch</p>
          <p className="mt-1 text-sm text-slate-600">
            {medicineSuggestion.name} · ₹{medicineSuggestion.price}
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            onClick={() =>
              acceptChoice(
                substitution.originalBranchId,
                medicineSuggestion.id
              )
            }
          >
            Use substitute
          </button>
        </div>
      )}

      {medicineOtherBranchSuggestion && (
        <div className="rounded-lg border border-purple-200 bg-white p-4">
          <p className="font-medium text-purple-900">
            Substitute at another branch
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {medicineOtherBranchSuggestion.name} ·{" "}
            {medicineOtherBranchSuggestion.branchName}
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
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

      <button
        type="button"
        onClick={reject}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Cancel order
      </button>
    </div>
  );
}
