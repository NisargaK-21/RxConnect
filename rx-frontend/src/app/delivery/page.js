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
import { claimJob, confirmPickup, confirmDelivery } from "@/services/delivery.service";

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
  const [activeTab, setActiveTab] = useState("available"); // "available" | "active" | "completed" | "all"

  // Order inspection modal
  const [inspectOrder, setInspectOrder] = useState(null);

  // Pickup Confirmation Modal
  const [confirmingPickupOrder, setConfirmingPickupOrder] = useState(null);

  // Delivery Confirmation Modal
  const [confirmingDeliverOrder, setConfirmingDeliverOrder] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [recipientName, setRecipientName] = useState("");

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
      setActiveTab("active");
      await refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Could not claim job. It may have already been claimed.", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handlePickupConfirmSubmit() {
    if (!confirmingPickupOrder) return;
    const orderId = confirmingPickupOrder.id || confirmingPickupOrder.order_reference;
    setBusyId(`pickup-${orderId}`);
    try {
      const data = await confirmPickup(orderId);
      toast(data?.message || `Order #${orderId} picked up! Now Out for Delivery.`, {
        variant: "success",
      });
      setConfirmingPickupOrder(null);
      if (inspectOrder && (inspectOrder.id === orderId || inspectOrder.order_reference === orderId)) {
        setInspectOrder(null);
      }
      await refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to confirm pickup.", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeliverConfirmSubmit() {
    if (!confirmingDeliverOrder) return;
    const orderId = confirmingDeliverOrder.id || confirmingDeliverOrder.order_reference;
    setBusyId(`deliver-${orderId}`);
    try {
      await confirmDelivery(orderId);
      toast(`Order #${orderId} marked as Delivered! Great job.`, { variant: "success" });
      setConfirmingDeliverOrder(null);
      setDeliveryNote("");
      setRecipientName("");
      if (inspectOrder && (inspectOrder.id === orderId || inspectOrder.order_reference === orderId)) {
        setInspectOrder(null);
      }
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

  const activeDeliveries = useMemo(() => {
    return visibleMine.filter((o) =>
      ["Packed", "packed", "Out for Delivery", "out for delivery", "picked_up", "Picked Up"].includes(
        o.status
      )
    );
  }, [visibleMine]);

  const completedDeliveries = useMemo(() => {
    return visibleMine.filter((o) => ["Delivered", "delivered"].includes(o.status));
  }, [visibleMine]);

  const totals = {
    available: available.length,
    mine: mine.length,
    inTransit: mine.filter((o) =>
      ["Out for Delivery", "out for delivery", "picked_up", "Picked Up"].includes(o.status)
    ).length,
    done: mine.filter((o) => ["Delivered", "delivered"].includes(o.status)).length,
  };

  return (
    <AppShell activeRoute="/delivery">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Delivery Partner Operations Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Delivery Partner Portal
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Claim packed prescription orders, verify pickups from pharmacy branches, and confirm drop-offs.
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
                placeholder="Search orders, branch or address..."
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

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard
            title="Ready for Pickup"
            value={loading ? null : totals.available}
            icon={ICONS.orders}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="My Active Tasks"
            value={loading ? null : activeDeliveries.length}
            icon={ICONS.delivery}
            accent="teal"
            loading={loading}
          />
          <StatCard
            title="Out for Delivery"
            value={loading ? null : totals.inTransit}
            icon={ICONS.tracking}
            accent="blue"
            loading={loading}
          />
          <StatCard
            title="Completed Drops"
            value={loading ? null : totals.done}
            icon={ICONS.check}
            accent="emerald"
            loading={loading}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto">
          {[
            { key: "available", label: `Ready for Pickup (${totals.available})`, icon: ICONS.orders },
            { key: "active", label: `My Active Tasks (${activeDeliveries.length})`, icon: ICONS.delivery },
            { key: "completed", label: `Delivered History (${totals.done})`, icon: ICONS.check },
            { key: "all", label: `All My Assignments (${totals.mine})`, icon: ICONS.tracking },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: tab.icon }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section based on Tab */}
        {activeTab === "available" && (
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span
                  className="w-5 h-5 text-indigo-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.orders }}
                />
                Unclaimed Packed Orders (Ready for Pickup)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These prescription orders have been verified & packed by pharmacists and are awaiting a delivery partner.
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <SkeletonCard lines={4} />
                  </div>
                ))}
              </div>
            ) : visibleAvailable.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-14 px-5 text-center">
                <EmptyState
                  icon="delivery"
                  title="No unclaimed packed orders"
                  description="All packed orders are currently claimed. New orders will appear here automatically."
                  variant="info"
                  ctaLabel="Check Again"
                  ctaOnClick={() => refresh(true)}
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
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up flex flex-col justify-between"
                      style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                    >
                      <div>
                        <header className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
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

                        <div className="space-y-2.5 text-xs mb-4">
                          <PinRow
                            icon={ICONS.profile}
                            label="Customer"
                            text={job.customer_name || "Customer"}
                            sub={job.customer_phone ? `📞 ${job.customer_phone}` : ""}
                          />
                          <PinRow
                            icon={ICONS.branches}
                            label="Pickup Branch"
                            text={job.pickup_branch || "Branch"}
                            sub={job.pickup_branch_address || ""}
                          />
                          <PinRow
                            icon={ICONS.location}
                            label="Drop-off Address"
                            text={job.delivery_address || job.dropoff_address || "Customer Address"}
                          />

                          {Array.isArray(job.items) && job.items.length > 0 && (
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                              <div className="font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                                <span>Package Contents</span>
                                <span>{job.items.length} item{job.items.length === 1 ? "" : "s"}</span>
                              </div>
                              {job.items.slice(0, 3).map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-800">
                                  <span className="truncate max-w-[180px]">{it.medicine_name || `Med #${it.id}`}</span>
                                  <span className="font-bold">× {it.quantity}</span>
                                </div>
                              ))}
                              {job.items.length > 3 && (
                                <div className="text-[10px] text-slate-400 italic">
                                  +{job.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Package Value:</span>
                          <span className="text-sm font-bold text-slate-900">
                            ₹{Number(job.total_amount || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectOrder(job)}
                            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClaim(ref)}
                            disabled={busy}
                            className="flex-2 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-600 btn-press transition disabled:opacity-60"
                          >
                            {busy ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span
                                className="w-3.5 h-3.5"
                                dangerouslySetInnerHTML={{ __html: ICONS.check }}
                              />
                            )}
                            Claim Job
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {activeTab === "active" && (
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span
                  className="w-5 h-5 text-teal-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.tracking }}
                />
                My Active Deliveries (In Progress)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm pickup from the pharmacy branch, then mark orders Delivered upon drop-off.
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4 stagger">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <SkeletonCard lines={4} />
                  </div>
                ))}
              </div>
            ) : activeDeliveries.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-14 px-5 text-center">
                <EmptyState
                  icon="delivery"
                  title="No active deliveries in progress"
                  description="Claim available jobs to add them to your active tasks."
                  variant="info"
                  ctaLabel="View Available Jobs"
                  ctaOnClick={() => setActiveTab("available")}
                />
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                {activeDeliveries.map((order, i) => (
                  <DeliveryJobCard
                    key={order.id || i}
                    order={order}
                    busyId={busyId}
                    onInspect={() => setInspectOrder(order)}
                    onStartPickup={() => setConfirmingPickupOrder(order)}
                    onStartDeliver={() => {
                      setConfirmingDeliverOrder(order);
                      setDeliveryNote("");
                      setRecipientName(order.customer_name || "");
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "completed" && (
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span
                  className="w-5 h-5 text-emerald-600"
                  dangerouslySetInnerHTML={{ __html: ICONS.check }}
                />
                Completed Deliveries History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review past successful drops and delivery timestamps.
              </p>
            </div>

            {completedDeliveries.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-14 px-5 text-center">
                <EmptyState
                  icon="check"
                  title="No completed deliveries yet"
                  description="Completed orders will appear in your delivery history."
                  variant="info"
                />
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                {completedDeliveries.map((order, i) => (
                  <DeliveryJobCard
                    key={order.id || i}
                    order={order}
                    busyId={busyId}
                    onInspect={() => setInspectOrder(order)}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "all" && (
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">All Assigned Deliveries</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete list of all orders assigned to your account.
              </p>
            </div>

            {visibleMine.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-14 px-5 text-center">
                <EmptyState
                  icon="delivery"
                  title="No assigned jobs"
                  description="Claim available jobs to get started."
                  variant="info"
                />
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                {visibleMine.map((order, i) => (
                  <DeliveryJobCard
                    key={order.id || i}
                    order={order}
                    busyId={busyId}
                    onInspect={() => setInspectOrder(order)}
                    onStartPickup={() => setConfirmingPickupOrder(order)}
                    onStartDeliver={() => {
                      setConfirmingDeliverOrder(order);
                      setDeliveryNote("");
                      setRecipientName(order.customer_name || "");
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Pickup Verification & Confirmation Modal */}
        {confirmingPickupOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setConfirmingPickupOrder(null)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-modal-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <span
                      className="w-5 h-5"
                      dangerouslySetInnerHTML={{ __html: ICONS.branches }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Confirm Pharmacy Pickup
                    </h2>
                    <p className="text-xs text-slate-500">
                      Order #{confirmingPickupOrder.id || confirmingPickupOrder.order_reference}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmingPickupOrder(null)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <span
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: ICONS.close }}
                  />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="font-bold mb-1">Pickup Location:</div>
                  <div>{confirmingPickupOrder.branch_name || confirmingPickupOrder.pickup_branch || "Pharmacy Branch"}</div>
                  <div className="text-slate-600 mt-0.5">{confirmingPickupOrder.pickup_branch_address}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Verify Package Items with Pharmacist
                  </div>
                  {Array.isArray(confirmingPickupOrder.items) && confirmingPickupOrder.items.length > 0 ? (
                    <div className="divide-y divide-slate-200/60">
                      {confirmingPickupOrder.items.map((it, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between items-center text-slate-800">
                          <span className="font-semibold">{it.medicine_name || `Medicine #${it.id}`}</span>
                          <span className="font-bold text-teal-700">Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">Package sealed and ready.</div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  By confirming, you acknowledge that you have physically collected the sealed medication package and will deliver it to:
                  <div className="font-bold text-slate-900 mt-1">
                    {confirmingPickupOrder.delivery_address || confirmingPickupOrder.dropoff_address || "Customer Address"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setConfirmingPickupOrder(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePickupConfirmSubmit}
                  disabled={busyId === `pickup-${confirmingPickupOrder.id || confirmingPickupOrder.order_reference}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 btn-press transition disabled:opacity-60"
                >
                  {busyId === `pickup-${confirmingPickupOrder.id || confirmingPickupOrder.order_reference}` ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span
                      className="w-3.5 h-3.5"
                      dangerouslySetInnerHTML={{ __html: ICONS.check }}
                    />
                  )}
                  Confirm Pickup & Start Delivery
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Drop-off Confirmation Modal */}
        {confirmingDeliverOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setConfirmingDeliverOrder(null)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-modal-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span
                      className="w-5 h-5"
                      dangerouslySetInnerHTML={{ __html: ICONS.check }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Confirm Final Delivery
                    </h2>
                    <p className="text-xs text-slate-500">
                      Order #{confirmingDeliverOrder.id || confirmingDeliverOrder.order_reference}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmingDeliverOrder(null)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <span
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: ICONS.close }}
                  />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="font-bold mb-1">Customer & Destination:</div>
                  <div className="font-semibold text-slate-900">{confirmingDeliverOrder.customer_name || "Customer"}</div>
                  <div className="text-slate-700 mt-0.5">
                    {confirmingDeliverOrder.delivery_address || confirmingDeliverOrder.dropoff_address}
                  </div>
                  {confirmingDeliverOrder.customer_phone && (
                    <div className="text-emerald-700 mt-1 font-semibold">
                      📞 {confirmingDeliverOrder.customer_phone}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Recipient Name / Handover Note
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Handed directly to patient / at door..."
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="E.g. Package placed at doorstep as requested."
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setConfirmingDeliverOrder(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeliverConfirmSubmit}
                  disabled={busyId === `deliver-${confirmingDeliverOrder.id || confirmingDeliverOrder.order_reference}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 btn-press transition disabled:opacity-60"
                >
                  {busyId === `deliver-${confirmingDeliverOrder.id || confirmingDeliverOrder.order_reference}` ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span
                      className="w-3.5 h-3.5"
                      dangerouslySetInnerHTML={{ __html: ICONS.check }}
                    />
                  )}
                  Mark Order Delivered
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Order Inspection Modal */}
        {inspectOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setInspectOrder(null)}
            />
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-modal-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span
                      className="w-5 h-5"
                      dangerouslySetInnerHTML={{ __html: ICONS.tracking }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Order #{inspectOrder.id || inspectOrder.order_reference} Details
                    </h2>
                    <p className="text-xs text-slate-500">
                      Complete delivery overview & item manifest
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectOrder(null)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <span
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: ICONS.close }}
                  />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                    <StatusBadge status={inspectOrder.status} size="md" />
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Amount</span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{Number(inspectOrder.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Pickup Branch
                    </div>
                    <div className="font-bold text-slate-900">{inspectOrder.branch_name || inspectOrder.pickup_branch || "Branch"}</div>
                    <div className="text-slate-600">{inspectOrder.pickup_branch_address || "Branch Address"}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Customer Drop-off
                    </div>
                    <div className="font-bold text-slate-900">{inspectOrder.customer_name || "Customer"}</div>
                    <div className="text-slate-600">{inspectOrder.delivery_address || inspectOrder.dropoff_address}</div>
                    {inspectOrder.customer_phone && (
                      <div className="text-teal-700 font-bold pt-1">📞 {inspectOrder.customer_phone}</div>
                    )}
                  </div>
                </div>

                {Array.isArray(inspectOrder.items) && inspectOrder.items.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Package Manifest ({inspectOrder.items.length} medicines)
                    </div>
                    <div className="divide-y divide-slate-200/60">
                      {inspectOrder.items.map((it, idx) => (
                        <div key={idx} className="py-2 flex justify-between items-center text-slate-800">
                          <div>
                            <div className="font-bold">{it.medicine_name || `Medicine #${it.id}`}</div>
                            <div className="text-slate-400 text-[10px]">Unit Price: ₹{it.unit_price}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-teal-700">Qty: {it.quantity}</span>
                            <div className="text-slate-900 font-bold">
                              ₹{(it.quantity * Number(it.unit_price || 0)).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setInspectOrder(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DeliveryJobCard({ order, busyId, onInspect, onStartPickup, onStartDeliver }) {
  const id = order.id || order.order_reference;
  const isPacked = order.status === "Packed" || order.status === "packed";
  const isOutForDelivery =
    order.status === "Out for Delivery" ||
    order.status === "out for delivery" ||
    order.status === "picked_up";
  const isDelivered = order.status === "Delivered" || order.status === "delivered";

  return (
    <li className="bg-white rounded-3xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up flex flex-col justify-between">
      <div>
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 text-white ${
                isDelivered
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20"
                  : isOutForDelivery
                  ? "bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-500/20"
                  : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-orange-500/20"
              }`}
            >
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

        <div className="space-y-2.5 text-xs mb-4">
          <PinRow
            icon={ICONS.profile}
            label="Customer"
            text={order.customer_name || "Customer"}
            sub={order.customer_phone ? `📞 ${order.customer_phone}` : ""}
          />
          <PinRow
            icon={ICONS.branches}
            label="Pickup Branch"
            text={order.branch_name || order.pickup_branch || "Branch"}
            sub={order.pickup_branch_address || ""}
          />
          <PinRow
            icon={ICONS.location}
            label="Delivery Destination"
            text={order.delivery_address || order.dropoff_address || "Customer Address"}
          />

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                <span>Medicines</span>
                <span>{order.items.length} items</span>
              </div>
              {order.items.slice(0, 2).map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <span className="truncate max-w-[180px]">{it.medicine_name || `Medicine #${it.id}`}</span>
                  <span className="font-bold">× {it.quantity}</span>
                </div>
              ))}
              {order.items.length > 2 && (
                <div className="text-[10px] text-slate-400 italic">
                  +{order.items.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Order Total:</span>
          <span className="text-sm font-bold text-slate-900">
            ₹{Number(order.total_amount || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onInspect && (
            <button
              type="button"
              onClick={onInspect}
              className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition shrink-0"
            >
              Details
            </button>
          )}

          {isPacked && onStartPickup ? (
            <button
              type="button"
              onClick={onStartPickup}
              disabled={busyId === `pickup-${id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 btn-press transition disabled:opacity-60"
            >
              {busyId === `pickup-${id}` ? (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <span
                  className="w-3.5 h-3.5"
                  dangerouslySetInnerHTML={{ __html: ICONS.check }}
                />
              )}
              Confirm Pickup
            </button>
          ) : isOutForDelivery && onStartDeliver ? (
            <button
              type="button"
              onClick={onStartDeliver}
              disabled={busyId === `deliver-${id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 btn-press transition disabled:opacity-60"
            >
              {busyId === `deliver-${id}` ? (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <span
                  className="w-3.5 h-3.5"
                  dangerouslySetInnerHTML={{ __html: ICONS.check }}
                />
              )}
              Mark Delivered
            </button>
          ) : isDelivered ? (
            <div className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1">
              <span
                className="w-3.5 h-3.5 text-emerald-600"
                dangerouslySetInnerHTML={{ __html: ICONS.check }}
              />
              Delivered
            </div>
          ) : (
            <div className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center bg-slate-50 border border-slate-100 text-slate-600">
              {order.status}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function PinRow({ icon, label, text, sub }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
        <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-slate-900 font-semibold mt-0.5 line-clamp-1">{text}</div>
        {sub ? <div className="text-[11px] text-slate-500 line-clamp-1">{sub}</div> : null}
      </div>
    </div>
  );
}
