"use client";

import { useEffect, useState } from "react";
import NotificationList from "@/components/NotificationList";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/DashboardCards";
import DashboardCards from "@/components/DashboardCards";
import NotificationList from "@/components/NotificationList";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";

<RequireAuth allowedRoles={["admin"]}>
  <DashboardContent />
</RequireAuth>


import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";

export default function DashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/dashboard");
        if (!cancelled) setBranches(res.data?.data || []);
      } catch (err) {
        if (!cancelled) toast("Failed to load dashboard", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalOrders = branches.reduce((sum, b) => sum + (b.orderCount || 0), 0);
  const totalDelivered = branches.reduce(
    (sum, b) => sum + (b.orders || []).filter((o) => o.status === "delivered").length,
    0
  );
  const totalPending = branches.reduce(
    (sum, b) => sum + (b.orders || []).filter((o) => ["pending", "placed"].includes(o.status)).length,
    0
  );

  return (
    <AppShell activeRoute="/dashboard">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
            <p className="mt-1.5 text-sm text-slate-500">Today&apos;s orders, performance and activity across all branches.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/fulfillment" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring">
              <span className="w-4 h-4 text-indigo-600" dangerouslySetInnerHTML={{ __html: ICONS.fulfillment }} />
              Fulfillment
            </Link>
            <Link href="/dashboard/low-stock" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring">
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.lowStock }} />
              Low Stock
            </Link>
          </div>
        </div>
  <NotificationList userId={4} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Branches"
            value={loading ? null : branches.length}
            icon={ICONS.branches}
            accent="teal"
            loading={loading}
            footer={
              !loading && (
                <span className="text-xs text-slate-500">
                  {branches.filter((b) => (b.orderCount || 0) > 0).length} with orders today
                </span>
              )
            }
          />
          <StatCard
            title="Orders Today"
            value={loading ? null : totalOrders}
            icon={ICONS.orders}
            accent="indigo"
            trend={totalOrders ? "up" : null}
            trendLabel={totalOrders ? "Live" : "No orders"}
            loading={loading}
          />
          <StatCard
            title="Delivered"
            value={loading ? null : totalDelivered}
            icon={ICONS.delivery}
            accent="emerald"
            loading={loading}
            footer={
              !loading && totalOrders > 0 ? (
                <span className="text-xs text-slate-500">
                  {Math.round((totalDelivered / totalOrders) * 100)}% fulfillment
                </span>
              ) : null
            }
          />
          <StatCard
            title="Pending Action"
            value={loading ? null : totalPending}
            icon={ICONS.allOrders}
            accent="amber"
            loading={loading}
            footer={!loading && totalPending > 0 ? <span className="text-xs text-amber-600 font-medium">{totalPending} orders need attention</span> : null}
          />

        <NotificationList userId={4} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          <DashboardCards title="Branches" value={loading ? null : branches.length} icon={ICONS.branches} accent="teal" loading={loading} footer={!loading && (<span className="text-xs text-slate-500">{branches.filter((b) => (b.orderCount || 0) > 0).length} with orders today</span>)} />
          <StatCard title="Orders Today" value={loading ? null : totalOrders} icon={ICONS.orders} accent="indigo" trend={totalOrders ? "up" : null} trendLabel={totalOrders ? "Live" : "No orders"} loading={loading} />
          <StatCard title="Delivered" value={loading ? null : totalDelivered} icon={ICONS.delivery} accent="emerald" loading={loading} footer={!loading && totalOrders > 0 ? (<span className="text-xs text-slate-500">{Math.round((totalDelivered / totalOrders) * 100)}% fulfillment</span>) : null} />
          <StatCard title="Pending Action" value={loading ? null : totalPending} icon={ICONS.allOrders} accent="amber" loading={loading} footer={!loading && totalPending > 0 ? <span className="text-xs text-amber-600 font-medium">{totalPending} orders need attention</span> : null} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SkeletonCard lines={1} className="!h-6 !w-1/3 mb-4" />
                <SkeletonTable rows={4} columns={4} />
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <EmptyState icon="branches" title="No branches yet" description="Add your first pharmacy branch to see order activity." variant="info" ctaHref="/branches" ctaLabel="Go to Branches" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger">
            {branches.map((branch, idx) => (
              <section key={branch.branchId} className={`bg-white rounded-2xl border border-slate-200 shadow-sm card-hover overflow-hidden animate-fade-in-up`} style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}>
                <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                      <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 leading-tight">{branch.branchName}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{branch.orderCount || 0} orders today</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/stock`} className="text-xs font-medium text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors">View stock →</Link>
                </header>

                {(branch.orders || []).length === 0 ? (
                  <div className="px-5 py-10">
                    <EmptyState icon="orders" title="No orders yet today" description="Once orders are placed they will appear here." size="sm" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 bg-slate-50/50">
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">#ID</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Customer</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Placed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {branch.orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-mono text-slate-900">#{order.id}</td>
                            <td className="px-5 py-3 text-slate-700">#{order.customer_id}</td>
                            <td className="px-5 py-3"><StatusBadge status={order.status} size="sm" /></td>
                            <td className="px-5 py-3 text-slate-500 text-xs">{order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {branch.orders.length > 5 && (<div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/30">Showing 5 of {branch.orders.length} orders</div>)}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
