"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/DashboardCards";
import { SkeletonCard } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { getUser } from "@/utils/auth";
import { toast } from "@/components/Toast";

const STEPS = ["Placed", "Verified", "Packed", "Out for Delivery", "Delivered"];

export default function OrderTrackingPage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist"]}>
      <OrderTrackingContent />
    </RequireAuth>
  );
}

function OrderTrackingContent() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const intervalRef = useRef(null);
  const user = getUser();

  const customerId = user?.id || 1;

  async function fetchOrders(showToast = false) {
    try {
      const res = await api.get(`/orders/customer/${customerId}`);
      setOrders(res.data?.orders || res.data?.data || []);
      if (showToast) toast("Orders refreshed", { variant: "success" });
    } catch (err) {
      if (showToast) toast("Failed to refresh orders", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [oRes, bRes] = await Promise.all([
          api.get(`/orders/customer/${customerId}`),
          api.get("/branches"),
        ]);
        if (cancelled) return;
        setOrders(oRes.data?.orders || oRes.data?.data || []);
        const list = Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || [];
        setBranches(list);
      } catch (err) {
        if (!cancelled) toast("Failed to load orders", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    intervalRef.current = setInterval(() => fetchOrders(false), 20000);
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [customerId]);

  async function openDetail(order) {
    try {
      const res = await api.get(`/orders/${order.id}`);
      const items = res.data?.items || [];
      const orderData = res.data?.order || res.data?.data || order;
      setSelectedOrder({ ...orderData, items });
    } catch (err) {
      toast("Failed to load details", { variant: "error" });
    }
  }

  async function handleCancel(order) {
    try {
      await api.patch(`/orders/${order.id}/cancel`, { customerId });
      toast("Order cancelled", { variant: "success" });
      setConfirmCancel(null);
      if (selectedOrder && selectedOrder.id === order.id) setSelectedOrder(null);
      fetchOrders(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to cancel", { variant: "error" });
    }
  }

  const totals = useMemo(() => {
    return {
      total: orders.length,
      inTransit: orders.filter((o) =>
        ["Verified", "verified", "Packed", "packed", "Out for Delivery", "out for delivery"].includes(o.status)
      ).length,
      delivered: orders.filter((o) =>
        ["Delivered", "delivered"].includes(o.status)
      ).length,
      open: orders.filter((o) =>
        ["Placed", "placed"].includes(o.status)
      ).length,
    };
  }, [orders]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let base = [...orders];
    if (statusFilter !== "all") {
      base = base.filter((o) => String(o.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    if (q) {
      base = base.filter((o) => String(o.id).includes(q));
    }
    return base.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [orders, statusFilter, q]);

  const branchName = (id) => branches.find((b) => b.id === id)?.name || `Branch #${id}`;

  return (
    <AppShell activeRoute="/order-tracking">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Order Tracking</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Track your orders in real-time and view details anytime.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.refresh }} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
              New order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard title="Total orders" value={loading ? null : totals.total} icon={ICONS.orders} accent="indigo" loading={loading} />
          <StatCard title="To verify" value={loading ? null : totals.open} icon={ICONS.prescriptions} accent="amber" loading={loading} />
          <StatCard title="In transit" value={loading ? null : totals.inTransit} icon={ICONS.delivery} accent="blue" loading={loading} />
          <StatCard title="Delivered" value={loading ? null : totals.delivered} icon={ICONS.tracking} accent="emerald" loading={loading} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" dangerouslySetInnerHTML={{ __html: ICONS.search }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order ID..."
                className="input-field w-full pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
          <div className="grid sm:grid-cols-2 gap-5 stagger">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <SkeletonCard lines={3} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 px-5">
            <EmptyState
              icon="orders"
              title={orders.length === 0 ? "No orders yet" : "No matching orders"}
              description={orders.length === 0 ? "Place your first order from our catalog." : "Try adjusting filters or search."}
              variant="info"
              ctaLabel={orders.length === 0 ? "Browse catalog" : undefined}
              ctaOnClick={orders.length === 0 ? () => router.push("/catalog") : undefined}
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5 stagger">
            {filtered.map((order, i) => {
              const normalized = order.status?.toString().toLowerCase();
              let activeIndex = STEPS.findIndex((s) => s.toLowerCase() === normalized);
              if (activeIndex < 0) activeIndex = 0;
              const cancelled = normalized === "cancelled";
              const delivered = normalized === "delivered";
              return (
                <article
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <header className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                        delivered
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/20"
                          : cancelled
                            ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-rose-500/20"
                            : "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-indigo-500/20"
                      }`}>
                        <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.tracking }} />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-lg">
                          #{order.id}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {branchName(order.branch_id)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </header>

                  <div className="mb-4">
                    <Timeline active={activeIndex} cancelled={cancelled} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Placed on</div>
                      <div className="mt-1 text-slate-800 text-xs">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total items</div>
                      <div className="mt-1 text-slate-800">
                        <span className="font-semibold tabular-nums">{order.item_count ?? "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDetail(order)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                    >
                      <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.eye }} />
                      View details
                    </button>
                    {!delivered && !cancelled ? (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(order)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring"
                      >
                        <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.trash }} />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selectedOrder && (
          <Modal title={`Order #${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <KV k="Status"><StatusBadge status={selectedOrder.status} size="sm" /></KV>
                <KV k="Branch">
                  <span className="text-slate-700 font-medium">
                    {branchName(selectedOrder.branch_id)}
                  </span>
                </KV>
                <KV k="Placed on">
                  <span className="text-slate-700 text-xs">
                    {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : "—"}
                  </span>
                </KV>
                <KV k="Total">
                  <span className="text-slate-800 font-semibold tabular-nums">
                    ₹{(selectedOrder.items || []).reduce((sum, it) => sum + (it.quantity || 0) * Number(it.unit_price ?? it.price ?? 0), 0).toLocaleString()}
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
                  <EmptyState icon="orders" title="No items" size="sm" />
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
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

        {confirmCancel && (
          <Modal title="Cancel this order?" onClose={() => setConfirmCancel(null)}>
            <p className="text-sm text-slate-600">
              Cancelling order #{confirmCancel.id} stops further processing and cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setConfirmCancel(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={() => handleCancel(confirmCancel)}
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

function Timeline({ active, cancelled }) {
  const safeActive = cancelled ? -1 : Math.max(0, Math.min(active, STEPS.length - 1));
  return (
    <ol className="flex items-start gap-1 mt-2">
      {STEPS.map((label, i) => {
        const done = !cancelled && i < safeActive;
        const current = !cancelled && i === safeActive;
        return (
          <li key={label} className="flex flex-col items-center flex-1 min-w-0 text-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                cancelled
                  ? "bg-white border-slate-200 text-slate-400"
                  : done
                    ? "bg-gradient-to-br from-teal-500 to-emerald-500 border-transparent text-white"
                    : current
                      ? "bg-white border-teal-500 text-teal-600 ring-4 ring-teal-500/10"
                      : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {done ? (
                <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </div>
            <div className={`mt-1.5 text-[10px] font-semibold leading-tight ${
              cancelled ? "text-slate-400" : i <= safeActive ? "text-slate-700" : "text-slate-400"
            }`}>
              {label}
            </div>
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
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
