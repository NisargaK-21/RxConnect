"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import { SkeletonTable } from "@/components/Skeleton";
import StatCard from "@/components/DashboardCards";
import StatusBadge from "@/components/StatusBadge";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";

export default function BranchesPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <BranchesManagement />
    </RequireAuth>
  );
}

function BranchesManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/branches");
        if (!cancelled) {
          setBranches(Array.isArray(res.data) ? res.data : res.data?.data || []);
        }
      } catch (err) {
        if (!cancelled) toast("Failed to load branches", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        (b.name || "").toLowerCase().includes(q) ||
        (b.address || "").toLowerCase().includes(q)
    );
  }, [branches, query]);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", address: "", phone: "" });
    setErrors({});
  }

  function openCreate() {
    resetForm();
    setOpenForm(true);
  }

  function handleEdit(b) {
    setEditingId(b.id);
    setForm({
      name: b.name || "",
      address: b.address || "",
      phone: b.phone || "",
    });
    setErrors({});
    setOpenForm(true);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Branch name is required";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || null,
    };
    try {
      if (editingId) {
        await api.put(`/branches/${editingId}`, payload);
        setBranches((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...payload } : b))
        );
        toast("Branch updated", { variant: "success", title: "Saved" });
      } else {
        const res = await api.post("/branches", payload);
        const created =
          res.data?.data?.id || res.data?.id
            ? res.data?.data || res.data
            : { ...payload, id: Date.now() };
        setBranches((prev) => [created, ...prev]);
        toast("Branch created", { variant: "success", title: "Saved" });
      }
      setOpenForm(false);
      resetForm();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to save", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function commitDelete() {
    if (!confirmDelete) return;
    try {
      await api.delete(`/branches/${confirmDelete}`);
      setBranches((prev) => prev.filter((b) => b.id !== confirmDelete));
      toast("Branch removed", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to delete", { variant: "error" });
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <AppShell activeRoute="/branches">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Branches
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Manage pharmacy locations, contact details and addresses.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
          >
            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
            Add branch
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <StatCard
            title="Total branches"
            value={loading ? null : branches.length}
            icon={ICONS.branches}
            accent="teal"
            loading={loading}
          />
          <StatCard
            title="With address"
            value={loading ? null : branches.filter((b) => b.address).length}
            icon={ICONS.location}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="Contactable"
            value={loading ? null : branches.filter((b) => b.phone).length}
            icon={ICONS.phone}
            accent="emerald"
            loading={loading}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="relative max-w-xl">
            <span
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              dangerouslySetInnerHTML={{ __html: ICONS.search }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search branches by name or address..."
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-5"><SkeletonTable rows={6} columns={5} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-5">
              <EmptyState
                icon="branches"
                title={branches.length === 0 ? "No branches yet" : "No matching branches"}
                description={
                  branches.length === 0
                    ? "Create your first pharmacy branch to get started."
                    : "Try a different search term."
                }
                variant="info"
                ctaLabel={branches.length === 0 ? "Add branch" : undefined}
                ctaOnClick={branches.length === 0 ? openCreate : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Branch</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Address</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Phone</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b, idx) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(idx * 40, 280)}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                            <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">{b.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 font-mono">#{b.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2 text-slate-600 max-w-sm">
                          <span className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" dangerouslySetInnerHTML={{ __html: ICONS.location }} />
                          <span className="line-clamp-2 leading-snug">{b.address || <span className="text-slate-400 text-xs italic">No address</span>}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {b.phone ? (
                          <div className="flex items-center gap-2 text-slate-700 font-mono text-xs">
                            <span className="w-4 h-4 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.phone }} />
                            {b.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={b.status === "inactive" ? "inactive" : "active"} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(b)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                          >
                            <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.edit }} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(b.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring"
                          >
                            <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.trash }} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {openForm && (
          <Modal onClose={() => setOpenForm(false)} title={editingId ? "Edit branch" : "Add branch"}>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Branch name" error={errors.name}>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Koramangala Pharmacy"
                />
              </Field>
              <Field label="Address" error={errors.address}>
                <textarea
                  className="input-field min-h-[96px] resize-y"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Full street address, city, PIN"
                />
              </Field>
              <Field label="Contact phone" error={errors.phone}>
                <input
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9xxxxxxxxx"
                />
              </Field>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-60"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  {editingId ? "Save changes" : "Create branch"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {confirmDelete !== null && (
          <Modal onClose={() => setConfirmDelete(null)} title="Delete branch">
            <p className="text-sm text-slate-600">
              Deleting a branch may affect linked orders, stock and staff assignments. This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitDelete}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 btn-press transition focus-ring"
              >
                Yes, delete
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-rose-600 font-medium">{error}</div>}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg modal-content animate-modal-in bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
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
