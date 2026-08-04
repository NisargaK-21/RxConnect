"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/DashboardCards";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";

export default function FulfillmentDashboard() {
  return (
    <RequireAuth allowedRoles={["admin", "staff"]}>
      <FulfillmentContent />
    </RequireAuth>
  );
}

function FulfillmentContent() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rate-asc");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/dashboard/fulfillment");
        if (!cancelled) setBranches(res.data?.data || []);
      } catch (err) {
        if (!cancelled) toast("Failed to load fulfillment", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const total = branches.reduce((s, b) => s + (b.totalOrders || 0), 0);
    const delivered = branches.reduce((s, b) => s + (b.deliveredOrders || 0), 0);
    const rate = total ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, rate };
  }, [branches]);

  const sorted = useMemo(() => {
    const arr = [...branches];
    switch (sortBy) {
      case "rate-desc":
        return arr.sort((a, b) => (b.fulfillmentRate || 0) - (a.fulfillmentRate || 0));
      case "rate-asc":
        return arr.sort((a, b) => (a.fulfillmentRate || 0) - (b.fulfillmentRate || 0));
      case "orders-desc":
        return arr.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
      case "orders-asc":
        return arr.sort((a, b) => (a.totalOrders || 0) - (b.totalOrders || 0));
      default:
        return arr;
    }
  }, [branches, sortBy]);

  return (
    <AppShell activeRoute="/dashboard/fulfillment">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Fulfillment Performance
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Track delivery rates and identify underperforming branches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          <StatCard
            title="Branches"
            value={loading ? null : branches.length}
            icon={ICONS.branches}
            accent="teal"
            loading={loading}
          />
          <StatCard
            title="Total Orders"
            value={loading ? null : totals.total}
            icon={ICONS.orders}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="Orders Delivered"
            value={loading ? null : totals.delivered}
            icon={ICONS.delivery}
            accent="emerald"
            loading={loading}
          />
          <StatCard
            title="Overall Fulfillment"
            value={loading ? null : `${totals.rate}%`}
            icon={ICONS.fulfillment}
            accent={totals.rate >= 90 ? "emerald" : totals.rate >= 70 ? "amber" : "rose"}
            loading={loading}
            footer={
              !loading ? (
                <span className={`text-xs font-medium ${
                  totals.rate >= 90 ? "text-emerald-600" : totals.rate >= 70 ? "text-amber-600" : "text-rose-600"
                }`}>
                  {totals.rate >= 90 ? "Excellent" : totals.rate >= 70 ? "On track" : "Needs attention"}
                </span>
              ) : null
            }
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Branch Performance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sorted by fulfillment rate, slowest first</p>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field !py-2.5 w-auto"
            >
              <option value="rate-asc">Rate: Low → High</option>
              <option value="rate-desc">Rate: High → Low</option>
              <option value="orders-desc">Orders: High → Low</option>
              <option value="orders-asc">Orders: Low → High</option>
            </select>
          </div>

          {loading ? (
            <div className="p-5">
              <SkeletonTable rows={6} columns={4} />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 px-5">
              <EmptyState
                icon="branches"
                title="No fulfillment data"
                description="Fulfillment metrics will appear once orders are processed."
                variant="info"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Branch</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Delivered</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider min-w-[220px]">
                      Fulfillment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((branch, idx) => {
                    const rate = Math.max(0, Math.min(100, Number(branch.fulfillmentRate) || 0));
                    const tone =
                      rate >= 90
                        ? "from-emerald-500 to-teal-500"
                        : rate >= 70
                          ? "from-amber-500 to-orange-500"
                          : "from-rose-500 to-pink-500";
                    const textTone =
                      rate >= 90
                        ? "text-emerald-700"
                        : rate >= 70
                          ? "text-amber-700"
                          : "text-rose-700";
                    return (
                      <tr
                        key={branch.branchId}
                        className="hover:bg-slate-50/70 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
                              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
                            </div>
                            <div className="font-semibold text-slate-900">{branch.branchName}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-700">{branch.totalOrders || 0}</td>
                        <td className="px-5 py-4 font-mono text-emerald-700 font-semibold">{branch.deliveredOrders || 0}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden min-w-[120px]">
                              <div
                                className={`h-full bg-gradient-to-r ${tone} transition-all duration-700 ease-out rounded-full`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className={`font-bold text-sm tabular-nums ${textTone}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
