"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/DashboardCards";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";

export default function LowStockDashboard() {
  return (
    <RequireAuth allowedRoles={["admin", "pharmacist", "staff"]}>
      <LowStockContent />
    </RequireAuth>
  );
}

function LowStockContent() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [ackFilter, setAckFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/dashboard/lowstock");
        if (!cancelled) setBranches(res.data?.data || []);
      } catch (err) {
        if (!cancelled) toast("Failed to load low stock", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalAlerts = useMemo(
    () => branches.reduce((sum, b) => sum + (b.lowStockItems || []).length, 0),
    [branches]
  );
  const criticalCount = useMemo(
    () =>
      branches.reduce(
        (sum, b) =>
          sum +
          (b.lowStockItems || []).filter((i) => i.quantity <= (i.threshold || 0) / 2).length,
        0
      ),
    [branches]
  );
  const unackedCount = useMemo(
    () =>
      branches.reduce(
        (sum, b) => sum + (b.lowStockItems || []).filter((i) => !i.acknowledged).length,
        0
      ),
    [branches]
  );

  const q = query.trim().toLowerCase();
  const filteredBranches = useMemo(() => {
    return branches
      .map((branch) => {
        const items = (branch.lowStockItems || []).filter((item) => {
          if (ackFilter === "ack" && !item.acknowledged) return false;
          if (ackFilter === "pending" && item.acknowledged) return false;
          if (criticalOnly && item.quantity > (item.threshold || 0) / 2) return false;
          if (q && !(item.medicineName || "").toLowerCase().includes(q)) return false;
          return true;
        });
        return { ...branch, lowStockItems: items };
      })
      .filter((b) => b.lowStockItems.length > 0);
  }, [branches, q, criticalOnly, ackFilter]);

  return (
    <AppShell activeRoute="/dashboard/low-stock">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Low Stock Alerts
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Monitor inventory levels and prioritize restocking across branches.
            </p>
          </div>
          <Link
            href="/dashboard/stock"
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
          >
            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.stock }} />
            Branch Stock
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          <StatCard
            title="Total Alerts"
            value={loading ? null : totalAlerts}
            icon={ICONS.lowStock}
            accent="rose"
            loading={loading}
          />
          <StatCard
            title="Critical Items"
            value={loading ? null : criticalCount}
            icon={ICONS.lowStock}
            accent="amber"
            loading={loading}
            footer={!loading ? <span className="text-xs text-amber-600 font-medium">Qty ≤ 50% of threshold</span> : null}
          />
          <StatCard
            title="Awaiting Review"
            value={loading ? null : unackedCount}
            icon={ICONS.prescriptions}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="Branches Affected"
            value={loading ? null : branches.filter((b) => (b.lowStockItems || []).length > 0).length}
            icon={ICONS.branches}
            accent="teal"
            loading={loading}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <span
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: ICONS.search || "" }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medicine..."
                className="input-field w-full pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ackFilter}
                onChange={(e) => setAckFilter(e.target.value)}
                className="input-field !py-2.5 w-auto"
              >
                <option value="all">All alerts</option>
                <option value="pending">Pending</option>
                <option value="ack">Acknowledged</option>
              </select>
              <button
                type="button"
                onClick={() => setCriticalOnly((v) => !v)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition btn-press focus-ring ${
                  criticalOnly
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${criticalOnly ? "bg-rose-500 animate-pulse-soft" : "bg-slate-300"}`}
                />
                Critical only
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SkeletonCard lines={1} className="!h-6 !w-1/3 mb-4" />
                <SkeletonTable rows={5} columns={4} />
              </div>
            ))}
          </div>
        ) : totalAlerts === 0 ? (
          <EmptyState
            icon="stock"
            title="All stock levels are healthy"
            description="No low stock alerts across any branch."
            variant="success"
          />
        ) : filteredBranches.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching alerts"
            description="Try clearing your filters or search query."
            variant="warning"
            ctaLabel="Clear filters"
            ctaOnClick={() => {
              setQuery("");
              setCriticalOnly(false);
              setAckFilter("all");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 stagger">
            {filteredBranches.map((branch, idx) => (
              <section
                key={branch.branchId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}
              >
                <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/60 via-white to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                      <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.lowStock }} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 leading-tight">
                        {branch.branchName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {branch.lowStockItems.length} item
                        {branch.lowStockItems.length === 1 ? "" : "s"} need attention
                      </p>
                    </div>
                  </div>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 bg-slate-50/50">
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Medicine</th>
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Qty</th>
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Threshold</th>
                        <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branch.lowStockItems.map((item) => {
                        const critical = item.quantity <= (item.threshold || 0) / 2;
                        return (
                          <tr
                            key={item.alertId}
                            className={`transition-colors ${
                              critical ? "bg-rose-50/30 hover:bg-rose-50/60" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="px-5 py-3">
                              <div className="font-medium text-slate-900">{item.medicineName}</div>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`font-mono font-semibold ${critical ? "text-rose-600" : "text-amber-600"}`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500 font-mono">{item.threshold}</td>
                            <td className="px-5 py-3">
                              <StatusBadge
                                status={
                                  item.acknowledged ? "acknowledged" : critical ? "critical" : "pending"
                                }
                                size="sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
