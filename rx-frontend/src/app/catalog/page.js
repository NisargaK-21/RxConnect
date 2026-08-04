"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";

export default function CatalogPage() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/catalog", { params: { search: query } });
        if (!cancelled) {
          setMedicines(res.data?.data || res.data || []);
        }
      } catch (err) {
        if (!cancelled) toast("Failed to load catalog", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return medicines;
    const needRx = typeFilter === "rx";
    return medicines.filter((m) => Boolean(m.requires_prescription) === needRx);
  }, [medicines, typeFilter]);

  const counts = useMemo(() => {
    const rx = medicines.filter((m) => m.requires_prescription).length;
    const otc = medicines.length - rx;
    return { rx, otc, total: medicines.length };
  }, [medicines]);

  return (
    <AppShell activeRoute="/catalog">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Medicine Catalog
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Browse medicines, check availability and add prescriptions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{loading ? "—" : counts.total}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.catalog }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Prescription</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{loading ? "—" : counts.rx}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">OTC</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{loading ? "—" : counts.otc}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <span
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: ICONS.search }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQuery(search);
                }}
                onBlur={() => setQuery(search)}
                placeholder="Search by name, salt or manufacturer..."
                className="input-field w-full pl-10"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "otc", label: "OTC" },
                { key: "rx", label: "Rx" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTypeFilter(opt.key)}
                  className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition btn-press focus-ring ${
                    typeFilter === opt.key
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent shadow-md shadow-teal-500/25"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SkeletonCard lines={4} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="catalog"
            title={medicines.length === 0 ? "Catalog is empty" : "No medicines match"}
            description={
              medicines.length === 0
                ? "Medicines will appear here once added to the catalog."
                : "Try a different search query or clear filters."
            }
            variant={medicines.length === 0 ? "info" : "warning"}
            ctaLabel={medicines.length === 0 ? undefined : "Clear filters"}
            ctaOnClick={
              medicines.length === 0
                ? undefined
                : () => {
                    setSearch("");
                    setQuery("");
                    setTypeFilter("all");
                  }
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
            {filtered.map((m, idx) => {
              const needRx = Boolean(m.requires_prescription);
              return (
                <Link
                  key={m.id}
                  href={`/catalog/${m.id}`}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover animate-fade-in-up focus-ring"
                  style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
                >
                  <div className="relative px-5 pt-5 pb-3 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm">
                      <span className="w-7 h-7" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
                    </div>
                    <span className="absolute top-4 right-4">
                      <StatusBadge status={needRx ? "Verified" : "Active"} size="sm" />
                    </span>
                  </div>
                  <div className="p-5 pt-3 space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2">
                        {m.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                        {m.description || (needRx ? "Prescription medicine" : "Over-the-counter medicine")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-xs text-slate-500">Price</div>
                        <div className="text-lg font-bold text-slate-900">
                          ₹{Number(m.price || 0).toLocaleString()}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 group-hover:gap-2 transition-all">
                        Details
                        <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
