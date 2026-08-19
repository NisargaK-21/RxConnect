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
import { uploadPrescription } from "@/services/prescription.service";

const LIFECYCLE_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "pending pharmacist review", label: "Pharmacist Review" },
  { key: "verified", label: "Verified" },
  { key: "packed", label: "Packed" },
  { key: "out for delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

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
  const [uploadingRxId, setUploadingRxId] = useState(null);
  const intervalRef = useRef(null);
  const user = getUser();

  const customerId = user?.id || 1;

  async function handleUploadPrescriptionForItem(orderItemId, file) {
    if (!file) return;
    setUploadingRxId(orderItemId);
    try {
      await uploadPrescription(orderItemId, file);
      toast("Prescription uploaded successfully!", { variant: "success" });
      if (selectedOrder) {
        openDetail(selectedOrder);
      }
      fetchOrders(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to upload prescription", { variant: "error" });
    } finally {
      setUploadingRxId(null);
    }
  }

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
      toast("Failed to load order details", { variant: "error" });
    }
  }

  async function handleCancel(order) {
    try {
      await api.patch(`/orders/${order.id}/cancel`, { customerId });
      toast(`Order #${order.id} cancelled`, { variant: "success" });
      setConfirmCancel(null);
      if (selectedOrder && selectedOrder.id === order.id) setSelectedOrder(null);
      fetchOrders(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to cancel order", { variant: "error" });
    }
  }

  const totals = useMemo(() => {
    return {
      total: orders.length,
      underReview: orders.filter((o) =>
        ["Pending Pharmacist Review", "pending pharmacist review", "Placed", "placed"].includes(
          o.status
        )
      ).length,
      inTransit: orders.filter((o) =>
        ["Verified", "verified", "Packed", "packed", "Out for Delivery", "out for delivery"].includes(
          o.status
        )
      ).length,
      delivered: orders.filter((o) => ["Delivered", "delivered"].includes(o.status)).length,
    };
  }, [orders]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let base = [...orders];
    if (statusFilter !== "all") {
      base = base.filter(
        (o) => String(o.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (q) {
      base = base.filter((o) => String(o.id).includes(q));
    }
    return base.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [orders, statusFilter, q]);

  const branchName = (id) => branches.find((b) => b.id === id)?.name || `Branch #${id}`;

  async function handleCancelItem(orderId, itemId) {
    try {
      await api.delete(`/orders/${orderId}/items/${itemId}`, { data: { customerId } });
      toast("Item cancelled from order", { variant: "success" });
      const res = await api.get(`/orders/${orderId}`);
      const items = res.data?.items || [];
      const orderData = res.data?.order || res.data?.data || selectedOrder;
      if (items.length === 0 || orderData.status === "Cancelled") {
        setSelectedOrder(null);
      } else {
        setSelectedOrder({ ...orderData, items });
      }
      fetchOrders(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to cancel item", { variant: "error" });
    }
  }

  const canCancelItems =
    selectedOrder &&
    [
      "Placed",
      "placed",
      "Pending Pharmacist Review",
      "pending pharmacist review",
      "Verified",
      "verified",
    ].includes(selectedOrder.status);

  return (
    <AppShell activeRoute="/order-tracking">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700 mb-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Live Order Lifecycle Tracking
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Order Tracking
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Track prescription verification, pharmacy packing, dispatch, and live delivery status.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span
                className="w-4 h-4"
                dangerouslySetInnerHTML={{ __html: ICONS.refresh }}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
            >
              <span
                className="w-4 h-4"
                dangerouslySetInnerHTML={{ __html: ICONS.plus }}
              />
              New Order
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard
            title="Total Orders"
            value={loading ? null : totals.total}
            icon={ICONS.orders}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="Processing / Review"
            value={loading ? null : totals.underReview}
            icon={ICONS.prescriptions}
            accent="amber"
            loading={loading}
          />
          <StatCard
            title="In Transit / Packed"
            value={loading ? null : totals.inTransit}
            icon={ICONS.delivery}
            accent="blue"
            loading={loading}
          />
          <StatCard
            title="Delivered"
            value={loading ? null : totals.delivered}
            icon={ICONS.check}
            accent="emerald"
            loading={loading}
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <span
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: ICONS.search }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search orders by ID..."
                className="input-field w-full pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field !py-2.5 w-auto text-xs font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="pending pharmacist review">Pending Pharmacist Review</option>
                <option value="verified">Verified</option>
                <option value="packed">Packed</option>
                <option value="out for delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-5 stagger">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <SkeletonCard lines={4} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-14 px-5">
            <EmptyState
              icon="orders"
              title={orders.length === 0 ? "No orders placed yet" : "No matching orders found"}
              description={
                orders.length === 0
                  ? "Explore our medicine catalog to place your first prescription order."
                  : "Try clearing your search or status filters."
              }
              variant="info"
              ctaLabel={orders.length === 0 ? "Browse Catalog" : undefined}
              ctaOnClick={orders.length === 0 ? () => router.push("/catalog") : undefined}
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5 stagger">
            {filtered.map((order, i) => {
              const normalized = String(order.status || "").toLowerCase();
              const isCancelled = normalized === "cancelled";
              const isRejected = normalized === "rejected";
              const isDelivered = normalized === "delivered";

              // Find step index in standard lifecycle
              let activeIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === normalized);
              if (activeIndex < 0) {
                if (normalized.includes("review") || normalized.includes("pending")) activeIndex = 1;
                else if (normalized.includes("pack")) activeIndex = 3;
                else if (normalized.includes("deliver") || normalized.includes("out")) activeIndex = 4;
                else activeIndex = 0;
              }

              return (
                <article
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up flex flex-col justify-between"
                  style={{ animationDelay: `${Math.min(i * 50, 250)}ms` }}
                >
                  <div>
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 text-white ${
                            isDelivered
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20"
                              : isRejected || isCancelled
                              ? "bg-gradient-to-br from-rose-500 to-red-500 shadow-rose-500/20"
                              : "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-indigo-500/20"
                          }`}
                        >
                          <span
                            className="w-5 h-5"
                            dangerouslySetInnerHTML={{ __html: ICONS.tracking }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-slate-900 text-lg truncate">
                            Order #{order.id}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {branchName(order.branch_id)}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </header>

                    {/* Timeline Lifecycle */}
                    <div className="mb-4">
                      <LifecycleTimeline
                        active={activeIndex}
                        cancelled={isCancelled}
                        rejected={isRejected}
                      />
                    </div>

                    {/* Rejection Notice Banner if applicable */}
                    {isRejected && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 mb-4 text-xs text-rose-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 text-rose-600"
                            dangerouslySetInnerHTML={{ __html: ICONS.close }}
                          />
                          Prescription Rejected by Pharmacist
                        </div>
                        <p className="text-[11px] text-rose-700">
                          {order.rejection_reason ||
                            order.reason ||
                            "Clinical review failed due to prescription discrepancy. Reserved stock has been released."}
                        </p>
                      </div>
                    )}

                    {/* Order Metadata summary */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Placed On
                        </div>
                        <div className="mt-0.5 font-semibold text-slate-800">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Items
                        </div>
                        <div className="mt-0.5 font-bold text-slate-900 tabular-nums">
                          {order.item_count ?? (Array.isArray(order.items) ? order.items.length : "—")} items
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openDetail(order)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                    >
                      <span
                        className="w-3.5 h-3.5"
                        dangerouslySetInnerHTML={{ __html: ICONS.eye }}
                      />
                      View Full Details
                    </button>

                    {!isDelivered && !isCancelled && !isRejected && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(order)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring border border-rose-100"
                      >
                        <span
                          className="w-3.5 h-3.5"
                          dangerouslySetInnerHTML={{ __html: ICONS.trash }}
                        />
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <Modal
            title={`Order #${selectedOrder.id} Details`}
            onClose={() => setSelectedOrder(null)}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <KV k="Status">
                  <StatusBadge status={selectedOrder.status} size="sm" />
                </KV>
                <KV k="Branch">
                  <span className="text-slate-800 font-bold">
                    {branchName(selectedOrder.branch_id)}
                  </span>
                </KV>
                <KV k="Order Date">
                  <span className="text-slate-700 font-medium">
                    {selectedOrder.created_at
                      ? new Date(selectedOrder.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </KV>
                <KV k="Order Total">
                  <span className="text-slate-900 font-bold tabular-nums">
                    ₹
                    {(selectedOrder.items || [])
                      .reduce(
                        (sum, it) =>
                          sum + (it.quantity || 0) * Number(it.unit_price ?? it.price ?? 0),
                        0
                      )
                      .toLocaleString()}
                  </span>
                </KV>
              </div>

              {/* Lifecycle Progress in Modal */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Order Status Progression
                </div>
                <LifecycleTimeline
                  active={LIFECYCLE_STEPS.findIndex(
                    (s) => s.key === String(selectedOrder.status || "").toLowerCase()
                  )}
                  cancelled={String(selectedOrder.status || "").toLowerCase() === "cancelled"}
                  rejected={String(selectedOrder.status || "").toLowerCase() === "rejected"}
                />
              </div>

              {/* Rejection Details if applicable */}
              {String(selectedOrder.status || "").toLowerCase() === "rejected" && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 text-rose-600"
                      dangerouslySetInnerHTML={{ __html: ICONS.close }}
                    />
                    Prescription Verification Rejected
                  </div>
                  <p className="text-slate-700">
                    {selectedOrder.rejection_reason ||
                      selectedOrder.reason ||
                      "The pharmacist rejected the prescription for this order. Please upload a valid doctor prescription or consult support."}
                  </p>
                </div>
              )}

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Medicines ({selectedOrder.items?.length || 0})
                  </div>
                  {canCancelItems && (selectedOrder.items || []).length > 1 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Individual item cancellation available
                    </span>
                  )}
                </div>

                {selectedOrder.items?.length ? (
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                    {selectedOrder.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{it.medicine_name || `Medicine #${it.medicine_id}`}</span>
                            {it.requires_prescription && (
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 font-semibold px-1.5 py-0.2 rounded border border-indigo-100">
                                Rx Required
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Qty {it.quantity} × ₹{it.unit_price ?? it.price}
                          </div>
                          {it.requires_prescription && (
                            <div className="mt-2 text-[11px]">
                              {it.prescription_status === "approved" ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                  ✓ Prescription Approved
                                </span>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,application/pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadPrescriptionForItem(it.id, file);
                                    }}
                                    className="text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                                  />
                                  {uploadingRxId === it.id && (
                                    <span className="text-xs text-teal-600 font-bold animate-pulse">Uploading...</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-slate-900 tabular-nums text-sm">
                            ₹
                            {(
                              (it.quantity || 0) * Number(it.unit_price ?? it.price ?? 0)
                            ).toLocaleString()}
                          </div>
                          {canCancelItems && (
                            <button
                              type="button"
                              onClick={() => handleCancelItem(selectedOrder.id, it.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100"
                              title="Cancel this item"
                            >
                              Cancel Item
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="orders" title="No items in order" size="sm" />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Cancel Confirmation Modal */}
        {confirmCancel && (
          <Modal title="Cancel this order?" onClose={() => setConfirmCancel(null)}>
            <p className="text-xs text-slate-600">
              Cancelling order #{confirmCancel.id} will halt fulfillment and release any reserved medicines back to pharmacy inventory.
            </p>
            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setConfirmCancel(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleCancel(confirmCancel)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 btn-press transition focus-ring"
              >
                Confirm Cancellation
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function LifecycleTimeline({ active, cancelled, rejected }) {
  const isFailed = cancelled || rejected;
  const safeActive = isFailed ? -1 : Math.max(0, Math.min(active, LIFECYCLE_STEPS.length - 1));

  return (
    <ol className="flex items-start gap-1 mt-2">
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = !isFailed && i < safeActive;
        const current = !isFailed && i === safeActive;
        return (
          <li key={step.key} className="flex flex-col items-center flex-1 min-w-0 text-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                isFailed
                  ? "bg-white border-slate-200 text-slate-400"
                  : done
                  ? "bg-gradient-to-br from-teal-500 to-emerald-500 border-transparent text-white shadow-xs"
                  : current
                  ? "bg-white border-teal-500 text-teal-600 ring-4 ring-teal-500/10 font-bold"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {done ? (
                <span
                  className="w-3.5 h-3.5"
                  dangerouslySetInnerHTML={{ __html: ICONS.check }}
                />
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </div>
            <div
              className={`mt-1.5 text-[9px] font-bold leading-tight ${
                isFailed
                  ? "text-slate-400"
                  : i <= safeActive
                  ? "text-slate-800"
                  : "text-slate-400"
              }`}
            >
              {step.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function KV({ k, children }) {
  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k}</div>
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
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-3 -my-1 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 btn-press transition focus-ring"
          >
            <span
              className="w-4 h-4"
              dangerouslySetInnerHTML={{ __html: ICONS.close }}
            />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
