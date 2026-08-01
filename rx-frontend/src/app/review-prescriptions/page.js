"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/DashboardCards";
import { SkeletonTable } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api, assetUrl } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";

export default function ReviewPrescriptionsPage() {
  return (
    <RequireAuth allowedRoles={["pharmacist", "admin", "staff"]}>
      <ReviewPrescriptionsContent />
    </RequireAuth>
  );
}

function ReviewPrescriptionsContent() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);

  async function refresh(showToast = false) {
    try {
      const res = await api.get("/prescriptions/pending");
      const list = res.data?.data || res.data?.prescriptions || [];
      setPrescriptions(Array.isArray(list) ? list : []);
      if (showToast) toast("List refreshed", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load prescriptions", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    refresh(false);
    const i = setInterval(() => refresh(false), 25000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  async function review(id, status) {
    setBusyId(id);
    try {
      await api.patch(`/prescriptions/${id}/review`, { status });
      toast(`Prescription ${status}`, { variant: status === "approved" ? "success" : "warning" });
      setOpen(null);
      setConfirmReject(null);
      refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to update", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return prescriptions;
    return prescriptions.filter((p) =>
      String(p.prescription_id || p.id || "").includes(q) ||
      (p.customer_name || "").toLowerCase().includes(q) ||
      (p.medicine_name || "").toLowerCase().includes(q)
    );
  }, [prescriptions, q]);

  const totals = useMemo(() => ({
    total: prescriptions.length,
    rx: prescriptions.filter((p) => p.medicine_name).length,
  }), [prescriptions]);

  return (
    <AppShell activeRoute="/review-prescriptions">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Review Prescriptions</h1>
            <p className="mt-1.5 text-sm text-slate-500">Approve or reject pending prescriptions before they are dispensed.</p>
          </div>
          <button
            type="button"
            onClick={() => refresh(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring self-start md:self-end"
          >
            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.refresh }} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard title="Pending" value={loading ? null : prescriptions.length} icon={ICONS.prescriptions} accent="amber" loading={loading} />
          <StatCard title="Unique meds" value={loading ? null : totals.rx} icon={ICONS.pill} accent="teal" loading={loading} />
          <StatCard title="Filtered" value={loading ? null : filtered.length} icon={ICONS.search} accent="indigo" loading={loading} />
          <StatCard title="Requires review" value={loading ? null : prescriptions.length > 0 ? "Yes" : "All clear"} icon={ICONS.shield} accent={prescriptions.length ? "violet" : "emerald"} loading={loading} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="relative">
            <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" dangerouslySetInnerHTML={{ __html: ICONS.search }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, customer name, or medicine..."
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SkeletonTable rows={8} columns={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 px-5">
            <EmptyState
              icon="prescriptions"
              title={prescriptions.length === 0 ? "All caught up" : "No matching prescriptions"}
              description={prescriptions.length === 0 ? "No pending prescriptions to review right now." : "Try a different search term."}
              variant="success"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden stagger">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">ID</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Medicine</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Qty</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Doc</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p, idx) => (
                    <tr key={p.prescription_id || p.id || idx} className="hover:bg-slate-50/70 transition-colors animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}>
                      <td className="px-5 py-4 font-mono font-semibold text-slate-900">#{p.prescription_id || p.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center border border-indigo-100">
                            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.shield }} />
                          </div>
                          <span className="font-medium text-slate-800">{p.customer_name || `Customer #${p.customer_id || "—"}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 flex items-center justify-center border border-teal-100">
                            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
                          </div>
                          <span className="font-medium">{p.medicine_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 tabular-nums">{p.quantity || 0}</td>
                      <td className="px-5 py-4">
                        {p.file_url ? (
                          <button
                            type="button"
                            onClick={() => setOpen(p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                          >
                            <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.eye }} />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">No file</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex flex-col sm:flex-row gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => review(p.prescription_id || p.id, "approved")}
                            disabled={busyId === (p.prescription_id || p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 btn-press transition focus-ring disabled:opacity-60"
                          >
                            {busyId === (p.prescription_id || p.id) ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
                            )}
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReject(p)}
                            disabled={busyId === (p.prescription_id || p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring disabled:opacity-60"
                          >
                            <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.close }} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {open && (
          <Modal title={`Prescription #${open.prescription_id || open.id}`} onClose={() => setOpen(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <KV k="Customer"><span className="text-slate-800 font-medium">{open.customer_name || "—"}</span></KV>
                <KV k="Medicine"><span className="text-slate-800 font-medium">{open.medicine_name || "—"}</span></KV>
                <KV k="Quantity"><span className="text-slate-800 tabular-nums font-medium">{open.quantity || 0}</span></KV>
                <KV k="Status"><StatusBadge status={open.status || "Pending"} size="sm" /></KV>
              </div>
              {open.file_url ? (
                <a
                  href={assetUrl(open.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                        <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.eye }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">Prescription file</div>
                        <div className="text-xs text-slate-500 mt-0.5">Open in new tab</div>
                      </div>
                    </div>
                    <span className="w-4 h-4 text-slate-500 shrink-0" dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }} />
                  </div>
                </a>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <EmptyState icon="search" title="No document attached" size="sm" />
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => review(open.prescription_id || open.id, "approved")}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 btn-press transition focus-ring"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(null); setConfirmReject(open); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring"
                >
                  Reject
                </button>
              </div>
            </div>
          </Modal>
        )}

        {confirmReject && (
          <Modal title="Reject this prescription?" onClose={() => setConfirmReject(null)}>
            <p className="text-sm text-slate-600">
              Rejecting prescription #{confirmReject.prescription_id || confirmReject.id} will prevent dispensing this medicine without a new prescription.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setConfirmReject(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
              >
                Keep for review
              </button>
              <button
                type="button"
                onClick={() => review(confirmReject.prescription_id || confirmReject.id, "rejected")}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 btn-press transition focus-ring"
              >
                Reject prescription
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
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
      <div className="relative w-full max-w-xl modal-content animate-modal-in bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-h-[85vh] overflow-y-auto">
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
