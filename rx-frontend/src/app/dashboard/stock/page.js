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

export default function BranchStockDashboard() {
  return (
    <RequireAuth allowedRoles={["admin", "pharmacist", "staff"]}>
      <StockContent />
    </RequireAuth>
  );
}

function StockContent() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [stock, setStock] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/branches");
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        if (!cancelled) {
          setBranches(list);
          if (list.length > 0 && !selectedBranch) {
            setSelectedBranch(String(list[0].id));
          } else {
            setInitialLoading(false);
          }
        }
      } catch (err) {
        if (!cancelled) toast("Failed to load branches", { variant: "error" });
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    let cancelled = false;
    setStockLoading(true);
    (async () => {
      try {
        const res = await api.get(`/stock?branchId=${selectedBranch}`);
        if (!cancelled) setStock(res.data?.data || res.data || []);
      } catch (err) {
        if (!cancelled) toast("Failed to load stock", { variant: "error" });
      } finally {
        if (!cancelled) {
          setStockLoading(false);
          setInitialLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBranch]);

  const currentBranch = branches.find((b) => String(b.id) === String(selectedBranch));

  const totals = useMemo(() => {
    const total = stock.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const lowCount = stock.filter(
      (i) => (Number(i.quantity) || 0) <= (Number(i.low_stock_threshold) || 0)
    ).length;
    const critical = stock.filter(
      (i) =>
        (Number(i.low_stock_threshold) || 0) > 0 &&
        (Number(i.quantity) || 0) <= (Number(i.low_stock_threshold) || 0) / 2
    ).length;
    const unique = stock.length;
    return { total, lowCount, critical, unique };
  }, [stock]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return stock.filter((item) => {
      const name = (item.medicine_name || item.medicineName || "").toLowerCase();
      if (q && !name.includes(q)) return false;
      if (showLowOnly) {
        const qty = Number(item.quantity) || 0;
        const thr = Number(item.low_stock_threshold) || 0;
        return thr > 0 && qty <= thr;
      }
      return true;
    });
  }, [stock, q, showLowOnly]);

  return (
    <AppShell activeRoute="/dashboard/stock">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Branch Stock
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Review real-time inventory levels and low-stock thresholds.
            </p>
          </div>
          <Link
            href="/dashboard/low-stock"
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
          >
            <span className="w-4 h-4 text-rose-500" dangerouslySetInnerHTML={{ __html: ICONS.lowStock }} />
            Low Stock Alerts
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 whitespace-nowrap">
              <span className="w-4 h-4 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="input-field !py-2.5 lg:max-w-xs"
            >
              {branches.length === 0 && <option value="">No branches</option>}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="lg:ml-auto flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-xl">
              <div className="relative flex-1">
                <span
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: ICONS.search }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search medicines..."
                  className="input-field w-full pl-10"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowLowOnly((v) => !v)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition btn-press focus-ring ${
                  showLowOnly
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.filter }} />
                Low only
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          <StatCard
            title="Unique Medicines"
            value={initialLoading ? null : totals.unique}
            icon={ICONS.pill}
            accent="indigo"
            loading={initialLoading}
          />
          <StatCard
            title="Total Units"
            value={initialLoading ? null : totals.total}
            icon={ICONS.stock}
            accent="teal"
            loading={initialLoading}
          />
          <StatCard
            title="Below Threshold"
            value={initialLoading ? null : totals.lowCount}
            icon={ICONS.lowStock}
            accent="amber"
            loading={initialLoading}
          />
          <StatCard
            title="Critical"
            value={initialLoading ? null : totals.critical}
            icon={ICONS.lowStock}
            accent="rose"
            loading={initialLoading}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {currentBranch ? `${currentBranch.name} Inventory` : "Inventory"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {filtered.length} of {stock.length} items shown
              </p>
            </div>
          </header>

          {initialLoading || stockLoading ? (
            <div className="p-5">
              <SkeletonTable rows={8} columns={4} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-5">
              <EmptyState
                icon="stock"
                title={stock.length === 0 ? "No stock recorded" : "No matching medicines"}
                description={
                  stock.length === 0
                    ? "Stock levels for this branch will appear once medicines are added."
                    : "Try clearing your filters or search query."
                }
                variant={stock.length === 0 ? "info" : "warning"}
                ctaLabel={stock.length === 0 ? undefined : "Clear filters"}
                ctaOnClick={
                  stock.length === 0
                    ? undefined
                    : () => {
                        setQuery("");
                        setShowLowOnly(false);
                      }
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Medicine</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Qty</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Threshold</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider min-w-[180px]">
                      Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item, idx) => {
                    const qty = Number(item.quantity) || 0;
                    const thr = Number(item.low_stock_threshold) || 0;
                    const pct =
                      thr > 0 ? Math.max(0, Math.min(100, (qty / (thr * 1.5)) * 100)) : qty > 0 ? 100 : 0;
                    const critical = thr > 0 && qty <= thr / 2;
                    const low = thr > 0 && qty <= thr;
                    const status = critical ? "critical" : low ? "pending" : "approved";
                    const tone = critical
                      ? "from-rose-500 to-pink-500"
                      : low
                        ? "from-amber-500 to-orange-500"
                        : "from-emerald-500 to-teal-500";
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors animate-fade-in-up ${
                          critical
                            ? "bg-rose-50/30 hover:bg-rose-50/60"
                            : low
                              ? "bg-amber-50/20 hover:bg-amber-50/40"
                              : "hover:bg-slate-50/70"
                        }`}
                        style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 flex items-center justify-center border border-teal-100">
                              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
                            </div>
                            <div className="font-semibold text-slate-900">
                              {item.medicine_name || item.medicineName}
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 py-4 font-mono font-semibold ${
                          critical ? "text-rose-600" : low ? "text-amber-600" : "text-slate-700"
                        }`}>
                          {qty}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-500">{thr || "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden min-w-[120px]">
                              <div
                                className={`h-full bg-gradient-to-r ${tone} transition-all duration-700 ease-out rounded-full`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <StatusBadge status={status} size="sm" />
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
