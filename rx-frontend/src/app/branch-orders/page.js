 "use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/DashboardCards";
import { SkeletonTable } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { getUser } from "@/utils/auth";
import { toast } from "@/components/Toast";

const NEXT_STATUS = {
  Placed: "Verified",
  placed: "verified",
  Verified: "Packed",
  verified: "packed",
  Packed: "Out for Delivery",
  packed: "out for delivery",
  "Out for Delivery": "Delivered",
  "out for delivery": "delivered",
};

const STEPS = ["Placed", "Verified", "Packed", "Out for Delivery", "Delivered"];

export default function BranchOrdersPage() {
  return (
    <RequireAuth allowedRoles={["admin", "staff", "pharmacist"]}>
      <BranchOrdersContent />
    </RequireAuth>
  );
}

function BranchOrdersContent() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const user = getUser();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dRes, bRes] = await Promise.all([
          api.get("/dashboard"),
          api.get("/branches"),
        ]);
        if (cancelled) return;
        const data = dRes.data?.data || [];
        setBranches(data);
        const list = Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || [];
        setAllBranches(list);
      } catch (err) {
        if (!cancelled) toast("Failed to load orders", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    try {
      const res = await api.get("/dashboard");
      setBranches(res.data?.data || []);
    } catch (err) {
      toast("Failed to refresh", { variant: "error" });
    }
  }

  const visibleBranches = useMemo(() => {
    const base =
      user?.branch_id && user.role !== "admin"
        ? branches.filter((b) => b.branchId === user.branch_id)
        : branches;
    if (branchFilter !== "all") {
      return base.filter((b) => String(b.branchId) === String(branchFilter));
    }
    return base;
  }, [branches, user, branchFilter]);

  const totals = useMemo(() => {
    const orders = visibleBranches.flatMap((b) => b.orders || []);
    return {
      total: orders.length,
      pending: orders.filter((o) => ["Placed", "placed"].includes(o.status)).length,
      inProgress: orders.filter((o) =>
        ["Verified", "verified", "Packed", "packed", "Out for Delivery", "out for delivery"].includes(o.status)
      ).length,
      delivered: orders.filter((o) => ["Delivered", "delivered"].includes(o.status)).length,
    };
  }, [visibleBranches]);

  const q = query.trim().toLowerCase();
  const filteredBranches = useMemo(() => {
    return visibleBranches
      .map((branch) => {
        let orders = branch.orders || [];
        if (statusFilter !== "all") {
          orders = orders.filter(
            (o) => String(o.status || "").toLowerCase() === statusFilter.toLowerCase()
          );
        }
        if (q) {
          orders = orders.filter(
            (o) =>
              String(o.id).includes(q) ||
              String(o.customer_id || "").includes(q)
          );
        }
        return { ...branch, orders };
      })
      .filter((b) => (statusFilter === "all" && !q ? true : b.orders.length > 0));
  }, [visibleBranches, statusFilter, q]);

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) {
      toast("Order is complete", { variant: "info" });
      return;
    }
    setBusyId(order.id);
    try {
      await api.patch(`/orders/${order.id}/status`, { status: next });
      toast(`Order marked ${next}`, { variant: "success" });
      await refresh();
      if (selectedOrder && selectedOrder.id === order.id) setSelectedOrder(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Status update failed", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(order) {
    setConfirmAction(null);
    try {
      await api.patch(`/orders/${order.id}/cancel`, { customer_id: order.customer_id });
      toast("Order cancelled", { variant: "success" });
      await refresh();
      if (selectedOrder && selectedOrder.id === order.id) setSelectedOrder(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to cancel", { variant: "error" });
    }
  }

  async function openDetails(order) {
    try {
      const res = await api.get(`/orders/${order.id}`);
      const data = res.data?.order || res.data?.data || res.data;
      setSelectedOrder({
        ...order,
        items: res.data?.items || data?.items || [],
        details: data,
      });
    } catch (err) {
      toast("Failed to load details", { variant: "error" });
    }
  }

  return (
    <AppShell activeRoute="/branch-orders">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Branch Orders
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Today&apos;s orders across branches. Advance status or cancel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.refresh }} />
              Refresh
            </button>
            <LinkOrButton
              user={user}
              onClick={() => router.push("/orders")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard title="Total" value={loading ? null : totals.total} icon={ICONS.orders} accent="indigo" loading={loading} />
          <StatCard title="To verify" value={loading ? null : totals.pending} icon={ICONS.prescriptions} accent="amber" loading={loading} />
          <StatCard title="In progress" value={loading ? null : totals.inProgress} icon={ICONS.tracking} accent="blue" loading={loading} />
          <StatCard title="Delivered" value={loading ? null : totals.delivered} icon={ICONS.delivery} accent="emerald" loading={loading} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" dangerouslySetInnerHTML={{ __html: ICONS.search }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order or customer ID..."
                className="input-field w-full pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="input-field !py-2.5 w-auto">
                <option value="all">All branches</option>
                {allBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !py-2.5 w-auto">
                <option value="all">All status</option>
                <option value="placed">Placed</option>
                <option value="verified">Verified</option>
                <option value="packed">Packed</option>
                <option value="out for delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SkeletonTable rows={8} columns={5} />
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-12 px-5">
            <EmptyState
              icon="orders"
              title="No orders found"
              description={visibleBranches.length === 0 ? "No orders were placed today." : "Try adjusting filters or search."}
              variant="info"
              ctaLabel={visibleBranches.length === 0 ? "Place order" : undefined}
              ctaOnClick={visibleBranches.length === 0 ? () => router.push("/orders") : undefined}
            />
          </div>
        ) : (
          <div className="space-y-6 stagger">
            {filteredBranches.map((branch, idx) => (
              <section
                key={branch.branchId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}
              >
                <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 leading-tight">{branch.branchName}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{branch.orders.length} order{branch.orders.length === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                </header>
                {branch.orders.length === 0 ? (
                  <div className="px-5 py-8">
                    <EmptyState icon="orders" title="No matching orders" description="Change filters to see more." size="sm" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 bg-slate-50/50">
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Order</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Customer</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Progress</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Placed</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {branch.orders.map((order) => {
                          const normalized =
                            Object.keys(NEXT_STATUS).find(
                              (k) => String(k).toLowerCase() === String(order.status).toLowerCase()
                            ) || order.status;
                          const idx = STEPS.findIndex((s) => s.toLowerCase() === String(normalized || "").toLowerCase());
                          const next = NEXT_STATUS[order.status] || NEXT_STATUS[normalized];
                          const cancelled = ["Cancelled", "cancelled"].includes(order.status);
                          const isDelivered = idx === STEPS.length - 1 && !cancelled;
                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 flex items-center justify-center border border-teal-100">
                                    <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.orders }} />
                                  </div>
                                  <div>
                                    <div className="font-mono font-semibold text-slate-900">#{order.id}</div>
                                    <div className="mt-0.5"><StatusBadge status={order.status} size="sm" /></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-700 font-mono text-xs">#{order.customer_id}</td>
                              <td className="px-5 py-4 min-w-[240px]">
                                {cancelled ? (
                                  <span className="text-xs text-rose-600 font-medium">Order cancelled</span>
                                ) : (
                                  <Stepper active={idx < 0 ? 0 : idx} steps={STEPS} />
                                )}
                              </td>
                              <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                                {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                              </td>
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                <div className="inline-flex flex-col sm:flex-row gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => openDetails(order)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                                  >
                                    <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.eye }} />
                                    Details
                                  </button>
                                  {next && !cancelled ? (
                                    <button
                                      type="button"
                                      onClick={() => advanceStatus(order)}
                                      disabled={busyId === order.id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-60"
                                    >
                                      {busyId === order.id ? (
                                        <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }} />
                                      )}
                                      {String(next).split(" ").map((w) => w.charAt(0)).join("")}
                                    </button>
                                  ) : null}
                                  {!isDelivered && !cancelled ? (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmAction({ type: "cancel", order })}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring"
                                    >
                                      <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.trash }} />
                                      Cancel
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {selectedOrder && (
          <Modal title={`Order #${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <KV k="Status"><StatusBadge status={selectedOrder.status} size="sm" /></KV>
                <KV k="Branch">
                  <span className="text-slate-700 font-medium">
                    {allBranches.find((b) => b.id === selectedOrder.branch_id || b.id === selectedOrder.details?.branch_id)?.name || selectedOrder.branch_id || "—"}
                  </span>
                </KV>
                <KV k="Customer ID"><span className="font-mono text-slate-700">#{selectedOrder.customer_id}</span></KV>
                <KV k="Placed">
                  <span className="text-slate-700">
                    {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : "—"}
                  </span>
                </KV>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Items</div>
                {selectedOrder.items?.length ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-medium text-slate-900">{it.medicine_name || `Medicine #${it.medicine_id}`}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Qty {it.quantity} × ₹{it.unit_price ?? it.price}</div>
                        </div>
                        <div className="font-semibold text-slate-900 tabular-nums">
                          ₹{((it.quantity || 0) * Number(it.unit_price ?? it.price ?? 0)).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="orders" title="No item details" description="Items not loaded yet." size="sm" />
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {confirmAction?.type === "cancel" && (
          <Modal title="Cancel this order?" onClose={() => setConfirmAction(null)}>
            <p className="text-sm text-slate-600">
              Cancelling order #{confirmAction.order.id} stops further processing and cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={() => handleCancel(confirmAction.order)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 btn-press transition focus-ring"
              >
                Cancel order
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function LinkOrButton({ user, onClick }) {
  const show = !user?.role || ["admin", "staff", "pharmacist"].includes(user.role);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
    >
      <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
      New order
    </button>
  );
}

function Stepper({ active, steps }) {
  const safeActive = Math.max(0, Math.min(active, steps.length - 1));
  return (
    <ol className="flex items-center gap-1 min-w-[200px]">
      {steps.map((label, i) => {
        const done = i < safeActive;
        const current = i === safeActive;
        return (
          <li key={label} className="flex items-center gap-1 flex-1 min-w-0 last:flex-none">
            <div
              className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center border transition-colors ${
                done
                  ? "bg-gradient-to-br from-teal-500 to-emerald-500 border-transparent text-white"
                  : current
                    ? "bg-white border-teal-500 text-teal-600 ring-4 ring-teal-500/10"
                    : "bg-white border-slate-200 text-slate-400"
              }`}
              title={label}
            >
              {done ? (
                <span className="w-3 h-3" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 rounded-full flex-1 min-w-[12px] transition-colors ${
                  i < safeActive ? "bg-teal-500" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function KV({ k, children }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{k}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl modal-content animate-modal-in bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-3 -my-1">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 btn-press transition focus-ring"
          >
            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.close }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
