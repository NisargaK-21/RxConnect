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
      const jobs = jRes.data?.data || jRes.data?.jobs || [];
      const assigned = mRes.data?.data || mRes.data?.jobs || [];
      setAvailable(Array.isArray(jobs) ? jobs : []);
      setMine(Array.isArray(assigned) ? assigned : []);
      if (showToast) toast("Jobs refreshed", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load jobs", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    refresh(false);
    const i = setInterval(() => refresh(false), 20000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  async function handleClaim(orderRef) {
    setBusyId(`claim-${orderRef}`);
    try {
      await api.patch(`/delivery/jobs/${orderRef}/claim`);
      toast("Job claimed", { variant: "success" });
      refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Could not claim job", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handlePickup(orderId) {
    setBusyId(`pickup-${orderId}`);
    try {
      await api.patch(`/delivery/jobs/${orderId}/pickup`);
      toast("Pickup confirmed", { variant: "success" });
      refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Pickup failed", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const visibleAvailable = useMemo(() => {
    if (!q) return available;
    return available.filter((j) =>
      String(j.order_reference || j.id || "").includes(q) ||
      (j.pickup_branch || "").toLowerCase().includes(q) ||
      (j.dropoff_address || j.delivery_address || "").toLowerCase().includes(q)
    );
  }, [available, q]);

  const visibleMine = useMemo(() => {
    if (!q) return mine;
    return mine.filter((j) =>
      String(j.id || j.order_reference || "").includes(q) ||
      (j.status || "").toLowerCase().includes(q)
    );
  }, [mine, q]);

  const totals = {
    available: available.length,
    mine: mine.length,
    picked: mine.filter((o) => ["picked_up", "picked up", "Picked up", "Picked Up", "Out for Delivery", "out for delivery"].includes(o.status)).length,
    done: mine.filter((o) => ["delivered", "Delivered"].includes(o.status)).length,
  };

  return (
    <AppShell activeRoute="/delivery">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Delivery</h1>
            <p className="mt-1.5 text-sm text-slate-500">Claim packed orders and confirm pickup when leaving the branch.</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <div className="relative">
              <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" dangerouslySetInnerHTML={{ __html: ICONS.search }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs..." className="input-field pl-10 w-full sm:w-72" />
            </div>
            <button type="button" onClick={() => refresh(true)} className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring">
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.refresh }} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard title="Available" value={loading ? null : totals.available} icon={ICONS.orders} accent="indigo" loading={loading} />
          <StatCard title="Mine" value={loading ? null : totals.mine} icon={ICONS.delivery} accent="teal" loading={loading} />
          <StatCard title="Picked up" value={loading ? null : totals.picked} icon={ICONS.tracking} accent="blue" loading={loading} />
          <StatCard title="Delivered" value={loading ? null : totals.done} icon={ICONS.check} accent="emerald" loading={loading} />
        </div>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 text-indigo-600" dangerouslySetInnerHTML={{ __html: ICONS.orders }} />
                Available jobs (packed)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Claim an order to start your route.</p>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 px-5">
              <EmptyState icon="delivery" title="No available jobs" description="Check back soon. New orders get assigned automatically when packed." variant="info" />
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {visibleAvailable.map((job, i) => {
                const ref = job.order_reference || job.id || job.order_id;
                const busy = busyId === `claim-${ref}`;
                return (
                  <li
                    key={String(ref) + i}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  >
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                          <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.delivery }} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-slate-900 truncate">#{ref}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Ready for pickup</div>
                        </div>
                      </div>
                      <StatusBadge status="Packed" size="sm" />
                    </header>

                    <div className="space-y-3 text-sm mb-5">
                      <PinRow icon={ICONS.branches} label="Pickup" text={job.pickup_branch || "—"} sub={job.pickup_branch_address || job.branch_address || ""} />
                      <PinRow icon={ICONS.location} label="Drop-off" text={job.dropoff_address || job.delivery_address || job.customer_address || "—"} sub={job.customer_name ? `For ${job.customer_name}` : ""} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaim(ref)}
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-60"
                    >
                      {busy ? (
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
                      )}
                      Claim job
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.tracking }} />
                My assignments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Confirm pickup when you leave the branch.</p>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 px-5">
              <EmptyState icon="delivery" title="No assignments yet" description="Claim an available job to get started." variant="info" ctaLabel="Refresh" ctaOnClick={() => refresh(true)} />
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {visibleMine.map((order, i) => {
                const id = order.id || order.order_reference;
                const packed = ["Packed", "packed", "Assigned", "assigned", "Claimed", "claimed"].includes(order.status);
                const busy = busyId === `pickup-${id}`;
                return (
                  <li
                    key={String(id) + i}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover p-5 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  >
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                          <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.tracking }} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-slate-900 truncate">#{id}</div>
                          <div className="text-xs text-slate-500 mt-0.5">My delivery</div>
                        </div>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </header>

                    <div className="space-y-3 text-sm mb-5">
                      <PinRow icon={ICONS.branches} label="Branch" text={order.branch_name || order.pickup_branch || "—"} sub={order.pickup_branch_address || order.branch_address || ""} />
                      <PinRow icon={ICONS.location} label="Drop-off" text={order.dropoff_address || order.delivery_address || order.customer_address || "—"} sub={order.customer_name ? `For ${order.customer_name}` : ""} />
                    </div>

                    {packed ? (
                      <button
                        type="button"
                        onClick={() => handlePickup(order.id)}
                        disabled={busy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 btn-press transition focus-ring disabled:opacity-60"
                      >
                        {busy ? (
                          <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
                        )}
                        Confirm pickup
                      </button>
                    ) : (
                      <div className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center bg-slate-50 border border-slate-100 text-slate-600">
                        {["Delivered", "delivered"].includes(order.status) ? "Delivered" : "Awaiting next step"}
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
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-slate-800 font-medium mt-0.5 line-clamp-2">{text}</div>
        {sub ? <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{sub}</div> : null}
      </div>
    </div>
  );
}
