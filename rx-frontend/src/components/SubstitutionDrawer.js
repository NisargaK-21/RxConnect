"use client";

import { useEffect, useMemo, useState } from "react";
import { ICONS } from "@/lib/navigation";
import StatusBadge from "@/components/StatusBadge";

/**
 * Out-of-Stock Substitution Drawer
 * 
 * Displays:
 * 1. Alternative stock from other branches
 * 2. Equivalent generic medicines at the current branch
 * 3. Substitute medicines at other branches
 * 4. Availability info and price comparisons
 * 
 * Allows customers to select an acceptable substitution and integrates with cart/order state.
 */
export default function SubstitutionDrawer({
  isOpen,
  onClose,
  substitution,
  onSelectBranch,
  onSelectSubstitute,
  onSelectOtherBranchSubstitute,
  onRequestApproval,
  onReject,
  loading = false,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  // Normalize suggestion payload from backend
  const normalized = useMemo(() => {
    if (!substitution) return null;

    const rawSuggestion = substitution.suggestion || substitution;
    const suggestionOptions = rawSuggestion.suggestionOptions || [];

    const opt_branch =
      rawSuggestion.branchSuggestion ||
      suggestionOptions.find((s) => s.type === "same_medicine_other_branch") ||
      (rawSuggestion.branchId
        ? {
            branchId: rawSuggestion.branchId,
            branchName: rawSuggestion.branchName,
            availableQuantity: rawSuggestion.availableQuantity || "In stock",
          }
        : null);

    const opt_med_same =
      rawSuggestion.medicineSuggestion ||
      suggestionOptions.find((s) => s.type === "substitute_same_branch") ||
      null;

    const opt_med_other =
      rawSuggestion.medicineOtherBranchSuggestion ||
      suggestionOptions.find((s) => s.type === "substitute_other_branch") ||
      null;

    return {
      orderId: substitution.orderId || rawSuggestion.orderId,
      orderItemId: substitution.orderItemId || rawSuggestion.orderItemId,
      originalMedicineId:
        substitution.originalMedicineId || rawSuggestion.originalMedicineId,
      originalMedicineName:
        substitution.originalMedicineName ||
        rawSuggestion.originalMedicineName ||
        `Medicine #${substitution.originalMedicineId || rawSuggestion.originalMedicineId || ""}`,
      originalBranchId:
        substitution.originalBranchId || rawSuggestion.originalBranchId,
      originalPrice: Number(substitution.originalPrice || rawSuggestion.originalPrice || 0),
      requestedQuantity: substitution.requestedQuantity || rawSuggestion.requestedQuantity || 1,
      branchSuggestion: opt_branch,
      medicineSuggestion: opt_med_same,
      medicineOtherBranchSuggestion: opt_med_other,
    };
  }, [substitution]);

  if (!isOpen) return null;

  const hasBranchOption = Boolean(normalized?.branchSuggestion);
  const hasGenericOption = Boolean(normalized?.medicineSuggestion);
  const hasOtherBranchGenericOption = Boolean(normalized?.medicineOtherBranchSuggestion);
  const hasAnyOption = hasBranchOption || hasGenericOption || hasOtherBranchGenericOption;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right relative"
          role="dialog"
          aria-modal="true"
          aria-label="Medicine Substitution Drawer"
        >
          {/* Top Header */}
          <header className="p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 mt-0.5">
                <span
                  className="w-6 h-6"
                  dangerouslySetInnerHTML={{ __html: ICONS.lowStock }}
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Out of Stock
                </div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                  Choose Medicine Substitution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requested medicine is currently unavailable in your selected branch.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors focus-ring shrink-0"
              aria-label="Close Drawer"
            >
              <span
                className="w-4 h-4"
                dangerouslySetInnerHTML={{ __html: ICONS.close }}
              />
            </button>
          </header>

          {/* Drawer Body - Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
            {/* Original Item Summary */}
            {normalized && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
                <div className="font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Unavailable Requested Item</span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    0 Units Available
                  </span>
                </div>
                <div className="text-slate-800 font-semibold text-sm mt-1">
                  {normalized.originalMedicineName}
                </div>
                <div className="text-slate-600 mt-0.5 flex items-center gap-3">
                  <span>Medicine ID: #{normalized.originalMedicineId}</span>
                  {normalized.originalPrice > 0 && (
                    <span>Price: ₹{normalized.originalPrice}</span>
                  )}
                  {normalized.requestedQuantity > 1 && (
                    <span>Qty requested: {normalized.requestedQuantity}</span>
                  )}
                </div>
              </div>
            )}

            {!hasAnyOption ? (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                  <span
                    className="w-7 h-7"
                    dangerouslySetInnerHTML={{ __html: ICONS.close }}
                  />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No Available Substitutes Found
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Unfortunately, this medicine is completely out of stock across all branches and no equivalent generic substitutes are on file.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Available Substitution Options ({[hasBranchOption, hasGenericOption, hasOtherBranchGenericOption].filter(Boolean).length})
                </div>

                {/* Option 1: Same Medicine at Other Branch */}
                {hasBranchOption && (
                  <div className="rounded-2xl border-2 border-blue-200 hover:border-blue-400 bg-white p-4.5 shadow-sm transition-all duration-200 card-hover relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 opacity-80" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <span
                              className="w-4.5 h-4.5"
                              dangerouslySetInnerHTML={{ __html: ICONS.branches }}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              Option 1 · Same Medicine
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              Transfer from Alternate Branch
                            </h3>
                          </div>
                        </div>
                        <StatusBadge status="Active" size="sm" />
                      </div>

                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-500 font-medium">Branch Location:</span>
                          <span className="font-bold text-slate-900">
                            {normalized.branchSuggestion.branchName || `Branch #${normalized.branchSuggestion.branchId}`}
                          </span>
                        </div>
                        {normalized.branchSuggestion.address && (
                          <div className="flex justify-between items-center text-slate-700">
                            <span className="text-slate-500 font-medium">Address:</span>
                            <span className="text-slate-600 truncate max-w-[200px]">
                              {normalized.branchSuggestion.address}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-500 font-medium">Stock Available:</span>
                          <span className="font-bold text-emerald-600">
                            {normalized.branchSuggestion.availableQuantity || "In Stock"} units
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectBranch(
                            normalized.branchSuggestion.branchId,
                            normalized.originalMedicineId
                          )
                        }
                        disabled={loading}
                        className="mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 btn-press transition focus-ring disabled:opacity-50"
                      >
                        <span
                          className="w-4 h-4"
                          dangerouslySetInnerHTML={{ __html: ICONS.check }}
                        />
                        Use This Branch ({normalized.branchSuggestion.branchName || `#${normalized.branchSuggestion.branchId}`})
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 2: Equivalent Generic Substitute (Same Branch) */}
                {hasGenericOption && (
                  <div className="rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 bg-white p-4.5 shadow-sm transition-all duration-200 card-hover relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-bl-full -z-0 opacity-80" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                            <span
                              className="w-4.5 h-4.5"
                              dangerouslySetInnerHTML={{ __html: ICONS.pill }}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Option 2 · Generic Substitute
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              {normalized.medicineSuggestion.name}
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          ₹{normalized.medicineSuggestion.price}
                        </span>
                      </div>

                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-500 font-medium">Substitute Formula:</span>
                          <span className="font-bold text-slate-900">
                            {normalized.medicineSuggestion.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-500 font-medium">Current Branch Stock:</span>
                          <span className="font-bold text-emerald-600">
                            {normalized.medicineSuggestion.availableQuantity ?? "Available"} units
                          </span>
                        </div>
                        {normalized.originalPrice > 0 && normalized.medicineSuggestion.price && (
                          <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500 font-medium">Price Difference:</span>
                            <span className="font-bold text-slate-800">
                              {Number(normalized.medicineSuggestion.price) <= normalized.originalPrice
                                ? `₹${(normalized.originalPrice - Number(normalized.medicineSuggestion.price)).toFixed(2)} cheaper`
                                : `+₹${(Number(normalized.medicineSuggestion.price) - normalized.originalPrice).toFixed(2)}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectSubstitute(
                            normalized.originalBranchId,
                            normalized.medicineSuggestion
                          )
                        }
                        disabled={loading}
                        className="mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 btn-press transition focus-ring disabled:opacity-50"
                      >
                        <span
                          className="w-4 h-4"
                          dangerouslySetInnerHTML={{ __html: ICONS.check }}
                        />
                        Select Equivalent Substitute ({normalized.medicineSuggestion.name})
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 3: Substitute Medicine at Another Branch */}
                {hasOtherBranchGenericOption && (
                  <div className="rounded-2xl border-2 border-purple-200 hover:border-purple-400 bg-white p-4.5 shadow-sm transition-all duration-200 card-hover relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-purple-50 to-pink-50 rounded-bl-full -z-0 opacity-80" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                            <span
                              className="w-4.5 h-4.5"
                              dangerouslySetInnerHTML={{ __html: ICONS.catalog }}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                              Option 3 · Alternate Branch & Generic
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              {normalized.medicineOtherBranchSuggestion.name}
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          ₹{normalized.medicineOtherBranchSuggestion.price}
                        </span>
                      </div>

                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-500 font-medium">Branch:</span>
                          <span className="font-bold text-slate-900">
                            {normalized.medicineOtherBranchSuggestion.branchName || `#${normalized.medicineOtherBranchSuggestion.branchId}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-500 font-medium">Available Units:</span>
                          <span className="font-bold text-emerald-600">
                            {normalized.medicineOtherBranchSuggestion.availableQuantity ?? "In Stock"} units
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectOtherBranchSubstitute(
                            normalized.medicineOtherBranchSuggestion.branchId,
                            normalized.medicineOtherBranchSuggestion
                          )
                        }
                        disabled={loading}
                        className="mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/20 btn-press transition focus-ring disabled:opacity-50"
                      >
                        <span
                          className="w-4 h-4"
                          dangerouslySetInnerHTML={{ __html: ICONS.check }}
                        />
                        Select Substitute at {normalized.medicineOtherBranchSuggestion.branchName || "Alternate Branch"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <footer className="p-5 md:p-6 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2.5">
            {onRequestApproval && (
              <button
                type="button"
                onClick={onRequestApproval}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-50 shadow-xs btn-press transition focus-ring disabled:opacity-50"
              >
                <span
                  className="w-4 h-4 text-amber-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.shield }}
                />
                Request Pharmacist Approval (Manual Hold)
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-200/70 hover:bg-slate-200 btn-press transition focus-ring disabled:opacity-50"
              >
                Dismiss
              </button>
              {onReject && (
                <button
                  type="button"
                  onClick={onReject}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 btn-press transition focus-ring disabled:opacity-50"
                >
                  Cancel / Remove Item
                </button>
              )}
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}
