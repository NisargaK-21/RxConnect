"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/DashboardCards";
import { SkeletonCard } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";
import { claimJob, confirmPickup } from "@/services/delivery.service";

export default function DeliveryPage() {
  return (
    <RequireAuth allowedRoles={["delivery", "admin", "staff"]}>
      <DeliveryContent />
    </RequireAuth>
  );
}

function DeliveryContent() {
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState("");

  async function refresh(showToast = false) {
    try {
      const [jRes, mRes] = await Promise.all([
        api.get("/delivery/jobs"),
        api.get("/delivery/my-jobs"),
      ]);
      const jobs = jRes.data?.data || jRes.data?.jobs || jRes.data || [];
      const assigned = mRes.data?.data || mRes.data?.jobs || mRes.data || [];
      setAvailable(Array.isArray(jobs) ? jobs : []);
      setMine(Array.isArray(assigned) ? assigned : []);
      if (showToast) toast("Delivery jobs refreshed", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load delivery jobs", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    refresh(false);
    const i = setInterval(() => refresh(false), 15000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  async function handleClaim(orderRef) {
    setBusyId(`claim-${orderRef}`);
    try {
      const data = await claimJob(orderRef);
      toast(data?.message || "Delivery job claimed successfully!", { variant: "success" });
      await refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Could not claim job. It may have already been claimed.", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handlePickupAction(orderId) {
    setBusyId(`pickup-${orderId}`);
    try {
      const data = await confirmPickup(orderId);
      toast(data?.message || "Pickup confirmed! Order is now out for delivery.", { variant: "success" });
      await refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to confirm pickup.", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeliverAction(orderId) {
    setBusyId(`deliver-${orderId}`);
    try {
      await api.patch(`/delivery/jobs/${orderId}/deliver`);
      toast("Order marked as Delivered successfully!", { variant: "success" });
      await refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to mark order as delivered.", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const visibleAvailable = useMemo(() => {
    if (!q) return available;
    return available.filter(
      (j) =>
        String(j.order_reference || j.id || "").includes(q) ||
        (j.pickup_branch || "").toLowerCase().includes(q) ||
        (j.delivery_address || j.dropoff_address || "").toLowerCase().includes(q) ||
        (j.customer_name || "").toLowerCase().includes(q)
    );
  }, [available, q]);

  const visibleMine = useMemo(() => {
    if (!q) return mine;
    return mine.filter(
      (j) =>
        String(j.id || j.order_reference || "").includes(q) ||
        (j.status || "").toLowerCase().includes(q) ||
        (j.delivery_address || "").toLowerCase().includes(q) ||
        (j.customer_name || "").toLowerCase().includes(q)
    );
  }, [mine, q]);

  const totals = {
    available: available.length,
    mine: mine.length,
    picked: mine.filter((o) =>
      ["Out for Delivery", "out for delivery", "picked_up", "Picked Up"].includes(o.status)
    ).length,
    done: mine.filter((o) => ["Delivered", "delivered"].includes(o.status)).length,
  };

  return (
    <AppShell activeRoute="/delivery">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Delivery Jobs
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Claim available packed orders, confirm pickup, and mark deliveries complete.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <div className="relative">
              <span
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: ICONS.search }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order ID, customer or address..."
                className="input-field pl-10 w-full sm:w-72"
              />
            </div>
            <button
              type="button"
              onClick={() => refresh(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span
                className="w-4 h-4"
                dangerouslySetInnerHTML={{ __html: ICONS.refresh }}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard
            title="Available Jobs"
            value={loading ? null : totals.available}
            icon={ICONS.orders}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="My Assignments"
            value={loading ? null : totals.mine}
            icon={ICONS.delivery}
            accent="teal"
            loading={loading}
          />
          <StatCard
            title="Out for Delivery"
            value={loading ? null : totals.picked}
            icon={ICONS.tracking}
            accent="blue"
            loading={loading}
          />
          <StatCard
            title="Completed"
            value={loading ? null : totals.done}
            icon={ICONS.check}
            accent="emerald"
            loading={loading}
          />
        </div>

        {/* Section 1: Available Jobs (Packed & Unclaimed) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span
                  className="w-5 h-5 text-indigo-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.orders }}
                />
                Available Jobs (Packed)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Claim packed orders ready for delivery pickup.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <SkeletonCard lines={3} />
                </div>
              ))}
            </div>
          ) : visibleAvailable.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-12 px-5">
              <EmptyState
                icon="delivery"
                title="No unclaimed packed jobs"
                description="All packed orders have been claimed. Check back when new orders are packed."
                variant="info"
              />
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {visibleAvailable.map((job, i) => {
                const ref = job.order_reference || job.id;
                const busy = busyId === `claim-${ref}`;
                return (
                  <li
                    key={String(ref) + i}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up flex flex-col justify-between"
                    style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  >
                    <div>
                      <header className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                            <span
                              className="w-5 h-5"
                              dangerouslySetInnerHTML={{ __html: ICONS.delivery }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-slate-900 truncate">
                              Order #{ref}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Customer #{job.customer_id || "—"}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status="Packed" size="sm" />
                      </header>

                      <div className="space-y-3 text-sm mb-4">
                        <PinRow
                          icon={ICONS.profile}
                          label="Customer Details"
                          text={job.customer_name || "Customer"}
                          sub={job.customer_phone ? `Phone: ${job.customer_phone}` : ""}
                        />
                        <PinRow
                          icon={ICONS.branches}
                          label="Pickup Branch"
                          text={job.pickup_branch || "Branch"}
                          sub={job.pickup_branch_address || ""}
                        />
                        <PinRow
                          icon={ICONS.location}
                          label="Delivery Address"
                          text={job.delivery_address || job.dropoff_address || "Customer Address"}
                        />
                        {Array.isArray(job.items) && job.items.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                            <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1">Medicines</div>
                            <div className="space-y-1">
                              {job.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-800">
                                  <span>{it.medicine_name || `Medicine #${it.id}`} × {it.quantity}</span>
                                  <span className="font-semibold">₹{(it.quantity * Number(it.unit_price || 0)).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {Number(job.total_amount || 0) > 0 && (
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 pt-1">
                            <span>Total Amount:</span>
                            <span className="text-sm font-bold text-slate-900">₹{Number(job.total_amount).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaim(ref)}
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-60 mt-3"
                    >
                      {busy ? (
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span
                          className="w-4 h-4"
                          dangerouslySetInnerHTML={{ __html: ICONS.check }}
                        />
                      )}
                      Claim Job
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Section 2: My Jobs (Assigned to logged-in Delivery Partner) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span
                  className="w-5 h-5 text-teal-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.tracking }}
                />
                My Jobs (Assigned Deliveries)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm pickup to start delivery, and mark orders Delivered upon drop-off.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4 stagger">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <SkeletonCard lines={3} />
                </div>
              ))}
            </div>
          ) : visibleMine.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-12 px-5">
              <EmptyState
                icon="delivery"
                title="No assigned jobs"
                description="Claim an available job above to add it to your delivery list."
                variant="info"
                ctaLabel="Refresh Jobs"
                ctaOnClick={() => refresh(true)}
              />
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {visibleMine.map((order, i) => {
                const id = order.id || order.order_reference;
                const isPacked = order.status === "Packed";
                const isOutForDelivery = order.status === "Out for Delivery";
                const isDelivered = order.status === "Delivered";
                const isPickupBusy = busyId === `pickup-${id}`;
                const isDeliverBusy = busyId === `deliver-${id}`;

                return (
                  <li
                    key={String(id) + i}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up flex flex-col justify-between"
                    style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  >
                    <div>
                      <header className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                            <span
                              className="w-5 h-5"
                              dangerouslySetInnerHTML={{ __html: ICONS.tracking }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-slate-900 truncate">
                              Order #{id}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Customer #{order.customer_id || "—"}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={order.status} size="sm" />
                      </header>

                      <div className="space-y-3 text-sm mb-4">
                        <PinRow
                          icon={ICONS.profile}
                          label="Customer Details"
                          text={order.customer_name || "Customer"}
                          sub={order.customer_phone ? `Phone: ${order.customer_phone}` : ""}
                        />
                        <PinRow
                          icon={ICONS.branches}
                          label="Pickup Branch"
                          text={order.branch_name || order.pickup_branch || "Branch"}
                          sub={order.pickup_branch_address || ""}
                        />
                        <PinRow
                          icon={ICONS.location}
                          label="Delivery Address"
                          text={order.delivery_address || order.dropoff_address || "Customer Address"}
                        />
                        {Array.isArray(order.items) && order.items.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                            <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1">Medicines</div>
                            <div className="space-y-1">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-800">
                                  <span>{it.medicine_name || `Medicine #${it.id}`} × {it.quantity}</span>
                                  <span className="font-semibold">₹{(it.quantity * Number(it.unit_price || 0)).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {Number(order.total_amount || 0) > 0 && (
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 pt-1">
                            <span>Total Amount:</span>
                            <span className="text-sm font-bold text-slate-900">₹{Number(order.total_amount).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isPacked ? (
                      <button
                        type="button"
                        onClick={() => handlePickupAction(id)}
                        disabled={isPickupBusy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 btn-press transition focus-ring disabled:opacity-60 mt-3"
                      >
                        {isPickupBusy ? (
                          <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span
                            className="w-4 h-4"
                            dangerouslySetInnerHTML={{ __html: ICONS.check }}
                          />
                        )}
                        Confirm Pickup
                      </button>
                    ) : isOutForDelivery ? (
                      <button
                        type="button"
                        onClick={() => handleDeliverAction(id)}
                        disabled={isDeliverBusy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 btn-press transition focus-ring disabled:opacity-60 mt-3"
                      >
                        {isDeliverBusy ? (
                          <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span
                            className="w-4 h-4"
                            dangerouslySetInnerHTML={{ __html: ICONS.check }}
                          />
                        )}
                        Mark Delivered
                      </button>
                    ) : isDelivered ? (
                      <div className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-center bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 mt-3">
                        <span
                          className="w-4 h-4 text-emerald-600"
                          dangerouslySetInnerHTML={{ __html: ICONS.check }}
                        />
                        Delivered
                      </div>
                    ) : (
                      <div className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-center bg-slate-50 border border-slate-100 text-slate-600 mt-3">
                        {order.status}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function PinRow({ icon, label, text, sub }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-slate-800 font-medium mt-0.5 line-clamp-2">{text}</div>
        {sub ? <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{sub}</div> : null}
      </div>
    </div>
  );
}
