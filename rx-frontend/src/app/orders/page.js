"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function OrdersPage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist"]}>
      <OrdersContent />
    </RequireAuth>
  );
}

function OrdersContent() {
  const router = useRouter();
  const user = getUser();

  const customerRoles = ["customer", "delivery"];
  const isCustomer = customerRoles.includes(user?.role);

  const [branches, setBranches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState(isCustomer ? String(user?.id || "") : "");
  const [branchId, setBranchId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [substitutionPending, setSubstitutionPending] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);

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
        if (bList.length && !branchId) setBranchId(String(bList[0].id));
      } catch (err) {
        if (!cancelled) toast("Failed to load catalog", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const q = query.trim().toLowerCase();
  const visibleMeds = useMemo(() => {
    if (!q) return medicines.slice(0, 150);
    return medicines.filter((m) =>
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
    const med = medicines.find((m) => m.id === id);
    if (!med) {
      toast("Medicine not found", { variant: "error" });
      return;
    }
    addLine(med);
    setMedicineId("");
  }

  function updateQty(key, delta) {
    setItems((prev) =>
      prev
        .map((it) =>
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

  const subtotal = items.reduce(
    (sum, it) => sum + (it.quantity || 0) * Number(it.unit_price || 0),
    0
  );

  async function placeOrder(substituteBranchId = null) {
    if (!customerId) {
      toast("Customer ID is required", { variant: "error" });
      return;
    }

    if (!branchId && !substituteBranchId) {
      toast("Branch is required", { variant: "error" });
      return;
    }

    if (!items.length) {
      toast("Add at least one medicine", { variant: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerId: Number(customerId),
        branchId: Number(substituteBranchId || branchId),
        items: items.map(({ medicineId, quantity }) => ({ medicineId, quantity })),
      };

      const res = await api.post("/orders", payload);
      const data = res.data || {};

      if (data.order?.status === "Pending Pharmacist Review") {
        toast("Order placed with prescription review pending", { variant: "info" });
        setSuggestion(null);
        setSubstitutionPending(null);
        setPendingPayload(null);
        setItems([]);
        router.push("/order-tracking");
        return;
      }

      toast(data.message || "Order placed", { variant: "success" });
      setSuggestion(null);
      setSubstitutionPending(null);
      setPendingPayload(null);
      setItems([]);
      setTimeout(() => router.push("/order-tracking"), 700);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      if (status === 409 && data.suggestion) {
        setSuggestion(data.suggestion);
        setSubstitutionPending({
          payload: {
            customerId: Number(customerId),
            branchId: Number(branchId),
            items: items.map(({ medicineId, quantity }) => ({ medicineId, quantity })),
          },
          suggestion: data.suggestion,
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

  const linesCount = items.length;
  const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);

  return (
    <AppShell activeRoute="/orders">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Place Order</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Build your cart, select a branch, and place your order.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => router.push("/catalog")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.home }} />
              Browse catalog
            </button>
            <button
              type="button"
              onClick={() => router.push("/order-tracking")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.tracking }} />
              Track orders
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard title="Cart items" value={linesCount} icon={ICONS.orders} accent="indigo" loading={loading} />
          <StatCard title="Total qty" value={totalQty} icon={ICONS.pill} accent="teal" loading={loading} />
          <StatCard title="Subtotal" value={subtotal ? `₹${subtotal.toLocaleString()}` : "—"} icon={ICONS.wallet} accent="amber" loading={loading} />
          <StatCard title="Branches" value={branches.length} icon={ICONS.branches} accent="violet" loading={loading} />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 card-hover">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.settings }} />
                Order details
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
                <Field label="Branch">
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input-field">
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Add medicine (search)">
                  <div className="relative">
                    <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" dangerouslySetInnerHTML={{ __html: ICONS.search }} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name, salt, manufacturer..."
                      className="input-field pl-10"
                    />
                  </div>
                </Field>
                <Field label="Or pick from list">
                  <div className="flex gap-2">
                    <select
                      value={medicineId}
                      onChange={(e) => setMedicineId(e.target.value)}
                      className="input-field !py-2.5 flex-1"
                    >
                      <option value="">Select a medicine...</option>
                      {(medicines || []).slice(0, 300).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.medicine_name || `Medicine #${m.id}`}
                          {m.type ? ` (${m.type})` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSelected}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
                    >
                      <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
                      Add
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 text-indigo-600" dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }} />
                  Medicines
                </h2>
                <span className="text-xs text-slate-500">{linesCount} item{linesCount === 1 ? "" : "s"}</span>
              </div>
              {loading ? (
                <div className="p-5">
                  <SkeletonTable rows={5} columns={4} />
                </div>
              ) : linesCount === 0 ? (
                <div className="py-12 px-5">
                  <EmptyState icon="cart" title="Your cart is empty" description="Add medicines from the list above to start your order." size="sm" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 bg-slate-50/50">
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Medicine</th>
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Unit</th>
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider w-[160px]">Quantity</th>
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Amount</th>
                        <th className="px-5 py-3 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <tr key={it.key} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 flex items-center justify-center border border-teal-100">
                                <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{it.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">ID #{it.medicineId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-700 tabular-nums">₹{Number(it.unit_price || 0).toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                              <button
                                type="button"
                                onClick={() => updateQty(it.key, -1)}
                                className="w-7 h-7 rounded-lg text-slate-600 bg-white hover:bg-slate-50 btn-press transition flex items-center justify-center"
                              >
                                <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.minus }} />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={it.quantity}
                                onChange={(e) => setQty(it.key, e.target.value)}
                                className="w-14 text-center bg-transparent text-slate-900 font-semibold tabular-nums outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQty(it.key, 1)}
                                className="w-7 h-7 rounded-lg text-slate-600 bg-white hover:bg-slate-50 btn-press transition flex items-center justify-center"
                              >
                                <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-900 tabular-nums">
                            ₹{((it.quantity || 0) * Number(it.unit_price || 0)).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(it.key)}
                              className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 btn-press transition flex items-center justify-center"
                            >
                              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.trash }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 text-violet-600" dangerouslySetInnerHTML={{ __html: ICONS.cart }} />
                  Quick add
                </h2>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                {loading ? (
                  <div className="grid sm:grid-cols-2 gap-3 stagger">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <SkeletonCard lines={2} />
                      </div>
                    ))}
                  </div>
                ) : visibleMeds.length === 0 ? (
                  <EmptyState icon="search" title="No medicines match" description="Try different search terms." size="sm" />
                ) : (
                  <ul className="grid sm:grid-cols-2 gap-3 stagger">
                    {visibleMeds.slice(0, 48).map((m, i) => {
                      const inCart = items.some((it) => it.medicineId === Number(m.id));
                      const price = Number(m.price || m.unit_price || 0);
                      return (
                        <li
                          key={m.id}
                          className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors animate-fade-in-up flex items-center justify-between gap-3"
                          style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{m.name || m.medicine_name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge status={m.type || "Rx"} size="sm" />
                              <span className="text-xs text-slate-500 tabular-nums">₹{price.toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addLine(m)}
                            disabled={inCart}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-50"
                          >
                            <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: inCart ? ICONS.check : ICONS.plus }} />
                            {inCart ? "Added" : "Add"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 card-hover sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 text-emerald-600" dangerouslySetInnerHTML={{ __html: ICONS.wallet }} />
                  Order summary
                </h2>
              </div>
              <dl className="text-sm divide-y divide-slate-100">
                <Row k="Items" v={String(linesCount)} />
                <Row k="Quantity" v={String(totalQty)} />
                <Row k="Subtotal" v={`₹${subtotal.toLocaleString()}`} />
                <Row k="Delivery" v="Standard" />
              </dl>
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Grand total</div>
                <div className="text-xl font-bold text-slate-900 tabular-nums">₹{subtotal.toLocaleString()}</div>
              </div>

              {suggestion && (
                <div className="mt-5 p-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                      <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.eye }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-amber-900">Alternative branch available</div>
                      <p className="mt-1 text-xs text-amber-800">
                        <span className="font-semibold">{suggestion.branchName || `Branch #${suggestion.branchId}`}</span>
                        {" "}has {suggestion.availableQuantity ?? "some"} units in stock.
                      </p>
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => placeOrder(suggestion.branchId)}
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-60"
                        >
                          <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
                          Place at alt branch
                        </button>
                        <button
                          type="button"
                          onClick={requestSubstitution}
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-900 bg-white border border-amber-200 hover:bg-amber-50 btn-press transition focus-ring disabled:opacity-60"
                        >
                          <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }} />
                          Request approval
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => placeOrder()}
                disabled={submitting || linesCount === 0 || !customerId || !branchId}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:via-emerald-600 hover:to-teal-700 btn-press transition focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }} />
                    Place order
                  </>
                )}
              </button>
              <p className="mt-3 text-[11px] text-center text-slate-500 leading-relaxed">
                By placing an order, you agree to our dispensing terms. Stock availability is verified at checkout.
              </p>
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
      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v }) {
  return (
    <div className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-800 tabular-nums">{v}</dd>
    </div>
  );
}
