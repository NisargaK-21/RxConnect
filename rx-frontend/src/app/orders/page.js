"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/DashboardCards";
import { SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { getUser } from "@/utils/auth";
import { toast } from "@/components/Toast";
import { useCart } from "@/context/CartContext";

export default function OrdersPage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist"]}>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading order form...</div>}>
        <OrdersContent />
      </Suspense>
    </RequireAuth>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = getUser();
  const { cart, clearCart } = useCart();

  const customerRoles = ["customer", "delivery"];
  const isCustomer = customerRoles.includes(user?.role);

  const [branches, setBranches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState(
    searchParams.get("customerId") || (isCustomer ? String(user?.id || "") : "")
  );
  const [branchId, setBranchId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [substitutionPending, setSubstitutionPending] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Sync with CartContext items if initial items are empty
  useEffect(() => {
    if (cart.length > 0 && items.length === 0) {
      const converted = cart.map((c, index) => ({
        key: `${c.medicineId}-${index}-${Date.now()}`,
        medicineId: Number(c.medicineId),
        name: c.name,
        unit_price: Number(c.price || 0),
        quantity: c.quantity || 1,
      }));
      setItems(converted);
    }
  }, [cart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bRes, mRes] = await Promise.all([
          api.get("/branches"),
          api.get("/catalog"),
        ]);
        if (cancelled) return;
        const bList = Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || [];
        const mList = Array.isArray(mRes.data) ? mRes.data : mRes.data?.data || [];
        setBranches(bList);
        setMedicines(mList);
        if (bList.length > 0 && !branchId) {
          setBranchId(String(bList[0].id));
        }
      } catch (err) {
        if (!cancelled) toast("Failed to load catalog data", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const visibleMeds = useMemo(() => {
    if (!q) return medicines.slice(0, 150);
    return medicines.filter(
      (m) =>
        (m.name || m.medicine_name || "").toLowerCase().includes(q) ||
        (m.salt || "").toLowerCase().includes(q) ||
        (m.manufacturer || "").toLowerCase().includes(q)
    );
  }, [medicines, q]);

  function addLine(med) {
    if (!med) return;
    const id = Number(med.id);
    setItems((prev) => {
      const exist = prev.find((it) => it.medicineId === id);
      if (exist) {
        return prev.map((it) =>
          it.medicineId === id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          key: `${id}-${Date.now()}`,
          medicineId: id,
          name: med.name || med.medicine_name || `Medicine #${id}`,
          unit_price: Number(med.price || med.unit_price || 0),
          quantity: 1,
        },
      ];
    });
  }

  function addSelected() {
    const id = Number(medicineId);
    if (!id) return;
    const med = medicines.find((m) => Number(m.id) === id);
    if (!med) {
      toast("Medicine not found", { variant: "error" });
      return;
    }
    addLine(med);
    setMedicineId("");
  }

  function updateQty(key, delta) {
    setItems((prev) =>
      prev.map((it) =>
        it.key === key
          ? { ...it, quantity: Math.max(1, (it.quantity || 1) + delta) }
          : it
      )
    );
  }

  function setQty(key, value) {
    const n = Math.max(1, Number(value) || 1);
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, quantity: n } : it)));
  }

  function removeLine(key) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  const normalizeSuggestion = (sub) => {
    if (!sub) return {};
    if (
      sub.branchSuggestion ||
      sub.medicineSuggestion ||
      sub.medicineOtherBranchSuggestion
    ) {
      return sub;
    }

    const branchSuggestion = sub.suggestionOptions?.find(
      (opt) => opt.type === "same_medicine_other_branch"
    );
    const medicineSuggestion = sub.suggestionOptions?.find(
      (opt) => opt.type === "substitute_same_branch"
    );
    const medicineOtherBranchSuggestion = sub.suggestionOptions?.find(
      (opt) => opt.type === "substitute_other_branch"
    );

    return {
      ...sub,
      branchSuggestion,
      medicineSuggestion,
      medicineOtherBranchSuggestion,
    };
  };

  const subtotal = items.reduce(
    (sum, it) => sum + (it.quantity || 0) * Number(it.unit_price || 0),
    0
  );

  async function placeOrder(substituteBranchId = null) {
    const activeCustomerId = customerId || (user ? String(user.id) : "1");
    if (!activeCustomerId) {
      toast("Customer ID is required", { variant: "error" });
      return;
    }

    if (!branchId && substituteBranchId == null) {
      toast("Branch selection is required", { variant: "error" });
      return;
    }

    if (!items.length) {
      toast("Add at least one medicine item", { variant: "error" });
      return;
    }

    const resolvedBranchId =
      substituteBranchId != null
        ? Number(substituteBranchId)
        : branchId
        ? Number(branchId)
        : null;

    if (!resolvedBranchId || Number.isNaN(resolvedBranchId)) {
      toast("Branch selection is required", { variant: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerId: Number(activeCustomerId),
        branchId: Number(resolvedBranchId),
        items: items.map(({ medicineId, quantity }) => ({ medicineId, quantity })),
      };

      const res = await api.post("/orders", payload);
      const data = res.data || {};

      toast(data.message || "Order placed successfully!", { variant: "success" });
      setSuggestion(null);
      setSubstitutionPending(null);
      setPendingPayload(null);
      setItems([]);
      clearCart();
      setTimeout(() => router.push("/order-tracking"), 700);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      if (status === 409 && data.substitutionRequired) {
        const rawSuggestion = data.suggestion || {
          branchSuggestion: data.branchSuggestion,
          medicineSuggestion: data.medicineSuggestion,
          medicineOtherBranchSuggestion: data.medicineOtherBranchSuggestion,
          originalBranchId: data.originalBranchId,
          originalMedicineId: data.originalMedicineId,
          branchId: data.branchId,
          branchName: data.branchName,
          suggestionOptions: data.suggestionOptions || [],
        };
        const branchSuggestionFromPayload =
          rawSuggestion.branchSuggestion ||
          (rawSuggestion.branchId
            ? {
                branchId: rawSuggestion.branchId,
                branchName: rawSuggestion.branchName,
              }
            : null);
        const suggestionData = {
          ...rawSuggestion,
          branchSuggestion: branchSuggestionFromPayload,
          branchId:
            rawSuggestion.branchId || branchSuggestionFromPayload?.branchId,
          branchName:
            rawSuggestion.branchName || branchSuggestionFromPayload?.branchName,
          suggestionOptions: rawSuggestion.suggestionOptions || [],
        };
        setSuggestion(suggestionData);
        setSubstitutionPending({
          payload: {
            customerId: Number(customerId),
            branchId: Number(branchId),
            items: items.map(({ medicineId, quantity }) => ({ medicineId, quantity })),
          },
          suggestion: suggestionData,
        });
        setPendingPayload({
          customerId: Number(customerId),
          branchId: Number(branchId),
          items: items.map(({ medicineId, quantity }) => ({ medicineId, quantity })),
        });
        toast(data.message || "Stock unavailable at selected branch", { variant: "warning" });
      } else {
        toast(data.message || "Failed to place order", { variant: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function requestSubstitution() {
    if (!substitutionPending || !pendingPayload) return;
    setSubmitting(true);
    try {
      await api.post("/orders/manual", {
        ...pendingPayload,
        customerId: substitutionPending.payload.customerId,
        requestedBranchId: substitutionPending.payload.branchId,
        alternativeBranchId: substitutionPending.suggestion.branchId,
        approvalType: "pharmacist_approval",
        items: substitutionPending.payload.items,
      });
      toast("Pharmacist approval requested", { variant: "info" });
      setSuggestion(null);
      setSubstitutionPending(null);
      setPendingPayload(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Approval request failed", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function applySubstituteMedicine() {
    const normalized = normalizeSuggestion(suggestion);
    if (!normalized?.medicineSuggestion || !normalized?.originalMedicineId) return;

    setItems((prev) =>
      prev.map((item) =>
        item.medicineId === normalized.originalMedicineId
          ? {
              ...item,
              medicineId: normalized.medicineSuggestion.id,
              name: normalized.medicineSuggestion.name,
              unit_price: Number(normalized.medicineSuggestion.price || item.unit_price),
            }
          : item
      )
    );

    toast("Substitute medicine applied to the current order.", { variant: "success" });
    setSuggestion(null);
    setPendingPayload(null);
    setSubstitutionPending(null);
  }

  const linesCount = items.length;
  const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const normalizedSuggestion = normalizeSuggestion(suggestion);
  const branchSuggestion =
    normalizedSuggestion.branchSuggestion ||
    (normalizedSuggestion.branchId
      ? {
          branchId: normalizedSuggestion.branchId,
          branchName: normalizedSuggestion.branchName,
        }
      : null);
  const suggestionBranchId = branchSuggestion?.branchId;
  const suggestionBranchName = branchSuggestion?.branchName;
  const substituteMedicineSuggestion = normalizedSuggestion.medicineSuggestion;
  const otherBranchMedicineSuggestion = normalizedSuggestion.medicineOtherBranchSuggestion;

  return (
    <AppShell activeRoute="/orders">
      <div className="animate-fade-in-up">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Create & Place Order
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Build your prescription order, select a branch, and initiate fulfillment.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => router.push("/catalog")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.home }} />
              Browse Catalog
            </button>
            <button
              type="button"
              onClick={() => router.push("/order-tracking")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.tracking }} />
              Track Orders
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard
            title="Cart Items"
            value={linesCount}
            icon={ICONS.orders}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="Total Units"
            value={totalQty}
            icon={ICONS.pill}
            accent="teal"
            loading={loading}
          />
          <StatCard
            title="Subtotal"
            value={subtotal ? `₹${subtotal.toLocaleString()}` : "—"}
            icon={ICONS.wallet}
            accent="amber"
            loading={loading}
          />
          <StatCard
            title="Active Branches"
            value={branches.length}
            icon={ICONS.branches}
            accent="violet"
            loading={loading}
          />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Form & Items */}
          <section className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 card-hover">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span
                  className="w-5 h-5 text-teal-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.settings }}
                />
                Order Parameters
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Customer ID">
                  <input
                    type="number"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={isCustomer}
                    placeholder={isCustomer ? "From your profile" : "e.g. 1"}
                    className="input-field disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </Field>

                <Field label="Fulfillment Branch">
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Search Medicine">
                  <div className="relative">
                    <span
                      className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: ICONS.search }}
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search name, composition..."
                      className="input-field pl-10"
                    />
                  </div>
                </Field>

                <Field label="Quick Add from List">
                  <div className="flex gap-2">
                    <select
                      value={medicineId}
                      onChange={(e) => setMedicineId(e.target.value)}
                      className="input-field !py-2.5 flex-1"
                    >
                      <option value="">Pick a medicine...</option>
                      {(medicines || []).slice(0, 300).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.medicine_name || `Medicine #${m.id}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSelected}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
                    >
                      <span
                        className="w-4 h-4"
                        dangerouslySetInnerHTML={{ __html: ICONS.plus }}
                      />
                      Add
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span
                    className="w-5 h-5 text-indigo-600"
                    dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }}
                  />
                  Selected Medicines
                </h2>
                <span className="text-xs text-slate-500">
                  {linesCount} item{linesCount === 1 ? "" : "s"}
                </span>
              </div>

              {loading ? (
                <div className="p-5">
                  <SkeletonTable rows={5} columns={4} />
                </div>
              ) : linesCount === 0 ? (
                <div className="py-12 px-5">
                  <EmptyState
                    icon="cart"
                    title="Order list is empty"
                    description="Add medicines from catalog or select from list above."
                    size="sm"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 bg-slate-50/50">
                        <th className="px-5 py-3 font-semibold text-xs uppercase">Medicine</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase">Unit Price</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase w-[160px]">
                          Quantity
                        </th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-right">
                          Amount
                        </th>
                        <th className="px-5 py-3 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <tr key={it.key} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                                <span
                                  className="w-4 h-4"
                                  dangerouslySetInnerHTML={{ __html: ICONS.pill }}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{it.name}</div>
                                <div className="text-xs text-slate-400">ID #{it.medicineId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-700 tabular-nums">
                            ₹{Number(it.unit_price || 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                              <button
                                type="button"
                                onClick={() => updateQty(it.key, -1)}
                                className="w-7 h-7 rounded-lg text-slate-600 bg-white hover:bg-slate-50 btn-press transition flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={it.quantity}
                                onChange={(e) => setQty(it.key, e.target.value)}
                                className="w-12 text-center bg-transparent text-slate-900 font-bold tabular-nums outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQty(it.key, 1)}
                                className="w-7 h-7 rounded-lg text-slate-600 bg-white hover:bg-slate-50 btn-press transition flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-slate-900 tabular-nums">
                            ₹{((it.quantity || 0) * Number(it.unit_price || 0)).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(it.key)}
                              className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 btn-press transition flex items-center justify-center"
                            >
                              <span
                                className="w-4 h-4"
                                dangerouslySetInnerHTML={{ __html: ICONS.trash }}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Right Column Summary */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 card-hover sticky top-24">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span
                  className="w-5 h-5 text-emerald-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.wallet }}
                />
                Order Summary
              </h2>

              <dl className="text-sm divide-y divide-slate-100">
                <Row k="Line Items" v={String(linesCount)} />
                <Row k="Total Units" v={String(totalQty)} />
                <Row k="Subtotal" v={`₹${subtotal.toLocaleString()}`} />
                <Row k="Status" v="Ready to Place" />
              </dl>

              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600 uppercase">Grand Total</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  ₹{subtotal.toLocaleString()}
                </div>
              </div>

              {branchSuggestion ? (
                <div className="mt-5 p-4 rounded-2xl border border-amber-200 bg-amber-50 animate-fade-in-up">
                  <div className="text-xs font-bold text-amber-900 mb-1">
                    Branch Stock Alert
                  </div>
                  <p className="text-xs text-amber-800 mb-3">
                    Item available at branch:{" "}
                    <strong>{suggestionBranchName || `#${suggestionBranchId}`}</strong>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetBranch = Number(suggestionBranchId);
                        if (!Number.isNaN(targetBranch)) {
                          setBranchId(String(targetBranch));
                          placeOrder(targetBranch);
                        }
                      }}
                      disabled={submitting}
                      className="flex-1 py-2 px-3 text-xs font-bold text-white bg-teal-600 rounded-xl shadow-sm hover:bg-teal-700"
                    >
                      Switch Branch
                    </button>
                    <button
                      type="button"
                      onClick={requestSubstitution}
                      disabled={submitting}
                      className="flex-1 py-2 px-3 text-xs font-bold text-amber-900 bg-white border border-amber-200 rounded-xl hover:bg-amber-100"
                    >
                      Request Approval
                    </button>
                  </div>
                </div>
              ) : null}

              {substituteMedicineSuggestion ? (
                <div className="mt-5 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 animate-fade-in-up">
                  <div className="text-xs font-bold text-emerald-900 mb-1">
                    Substitute Medicine Available in Current Branch
                  </div>
                  <p className="text-xs text-slate-800 mb-2">
                    {substituteMedicineSuggestion.name} · ₹{substituteMedicineSuggestion.price}
                  </p>
                  <p className="text-xs text-slate-600 mb-4">
                    Available quantity: {substituteMedicineSuggestion.availableQuantity}
                  </p>
                  <button
                    type="button"
                    onClick={applySubstituteMedicine}
                    disabled={submitting}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-sm hover:bg-emerald-700"
                  >
                    Use Substitute Medicine
                  </button>
                </div>
              ) : null}

              {otherBranchMedicineSuggestion ? (
                <div className="mt-5 p-4 rounded-2xl border border-purple-200 bg-purple-50 animate-fade-in-up">
                  <div className="text-xs font-bold text-purple-900 mb-1">
                    Substitute Medicine Available at Another Branch
                  </div>
                  <p className="text-xs text-slate-800 mb-2">
                    {otherBranchMedicineSuggestion.name} · ₹{otherBranchMedicineSuggestion.price}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    Branch: {otherBranchMedicineSuggestion.branchName || `#${otherBranchMedicineSuggestion.branchId}`}
                  </p>
                  <p className="text-xs text-slate-600 mb-4">
                    Available quantity: {otherBranchMedicineSuggestion.availableQuantity}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!otherBranchMedicineSuggestion.branchId || !otherBranchMedicineSuggestion.id) return;
                      setBranchId(String(otherBranchMedicineSuggestion.branchId));
                      setItems((prev) =>
                        prev.map((item) =>
                          item.medicineId === suggestion.originalMedicineId
                            ? {
                                ...item,
                                medicineId: otherBranchMedicineSuggestion.id,
                                name: otherBranchMedicineSuggestion.name,
                                unit_price: Number(otherBranchMedicineSuggestion.price || item.unit_price),
                              }
                            : item
                        )
                      );
                      toast("Switched to substitute medicine at the alternate branch.", { variant: "success" });
                    }}
                    disabled={submitting}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-purple-600 rounded-xl shadow-sm hover:bg-purple-700"
                  >
                    Use This Substitute Option
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => placeOrder()}
                disabled={submitting || linesCount === 0 || !branchId}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700 btn-press transition focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <span
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }}
                  />
                )}
                {submitting ? "Processing..." : "Place Order"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ k, v }) {
  return (
    <div className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
      <dt className="text-slate-500 font-medium">{k}</dt>
      <dd className="font-bold text-slate-800 tabular-nums">{v}</dd>
    </div>
  );
}
