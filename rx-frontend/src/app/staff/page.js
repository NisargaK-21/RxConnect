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

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "delivery", label: "Delivery" },
  { value: "admin", label: "Admin" },
];

const ROLE_GRADIENT = {
  admin: "from-violet-500 to-fuchsia-500",
  pharmacist: "from-teal-500 to-emerald-500",
  staff: "from-indigo-500 to-sky-500",
  delivery: "from-amber-500 to-orange-500",
  customer: "from-emerald-500 to-teal-500",
};

const roleTone = (role) => ROLE_GRADIENT[role] || "from-slate-500 to-slate-600";

export default function StaffPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <StaffManagement />
    </RequireAuth>
  );
}

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    branch_id: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, bRes] = await Promise.all([
          api.get("/users/staff"),
          api.get("/branches"),
        ]);
        if (cancelled) return;
        setStaff(Array.isArray(sRes.data) ? sRes.data : sRes.data?.data || []);
        setBranches(Array.isArray(bRes.data) ? bRes.data : bRes.data?.data || []);
      } catch (err) {
        if (!cancelled) toast("Failed to load data", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const byRole = staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {});
    return { total: staff.length, ...byRole };
  }, [staff]);

  const branchMap = useMemo(
    () => Object.fromEntries(branches.map((b) => [b.id, b])),
    [branches]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (q) {
        const hay = `${u.name || ""} ${u.email || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [staff, query, roleFilter]);

  function resetForm() {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", role: "staff", branch_id: "" });
    setErrors({});
  }

  function openCreate() {
    resetForm();
    setOpenForm(true);
  }

  function handleEdit(u) {
    setEditingId(u.id);
    setFormData({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "staff",
      branch_id: u.branch_id ? String(u.branch_id) : "",
    });
    setErrors({});
    setOpenForm(true);
  }

  function validate() {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email || "")) e.email = "Valid email is required";
    if (!editingId && !formData.password) e.password = "Password is required";
    if (!editingId && formData.password && formData.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (!ROLE_OPTIONS.some((r) => r.value === formData.role)) e.role = "Choose a valid role";
    if (formData.role !== "admin" && !formData.branch_id) e.branch_id = "Assign a branch";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      branch_id: formData.role === "admin" ? null : Number(formData.branch_id),
    };
    if (formData.password) payload.password = formData.password;
    try {
      if (editingId) {
        await api.put(`/users/staff/${editingId}`, payload);
        setStaff((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...payload, id: editingId } : s))
        );
        toast("Staff updated", { variant: "success", title: "Saved" });
      } else {
        const res = await api.post("/users/staff", payload);
        const created =
          res.data?.data?.id || res.data?.id
            ? res.data?.data || res.data
            : { ...payload, id: Date.now() };
        setStaff((prev) => [created, ...prev]);
        toast("Staff created", { variant: "success", title: "Saved" });
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
      await api.delete(`/users/staff/${confirmDelete}`);
      setStaff((prev) => prev.filter((u) => u.id !== confirmDelete));
      toast("Staff removed", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to delete", { variant: "error" });
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <AppShell activeRoute="/staff">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
            <p className="mt-1.5 text-sm text-slate-500">Onboard team members, assign roles and branches.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
          >
            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
            Add staff
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard title="Total staff" value={loading ? null : counts.total} icon={ICONS.staff} accent="indigo" loading={loading} />
          <StatCard title="Pharmacists" value={loading ? null : counts.pharmacist || 0} icon={ICONS.prescriptions} accent="teal" loading={loading} />
          <StatCard title="Staff" value={loading ? null : counts.staff || 0} icon={ICONS.branches} accent="blue" loading={loading} />
          <StatCard title="Delivery" value={loading ? null : counts.delivery || 0} icon={ICONS.delivery} accent="amber" loading={loading} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" dangerouslySetInnerHTML={{ __html: ICONS.search }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="input-field w-full pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field !py-2.5 w-auto"
            >
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-5"><SkeletonTable rows={8} columns={6} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-5">
              <EmptyState
                icon="staff"
                title={staff.length === 0 ? "No staff yet" : "No matching staff"}
                description={staff.length === 0 ? "Add your first team member to get started." : "Try adjusting your search or filter."}
                variant="info"
                ctaLabel={staff.length === 0 ? "Add staff" : undefined}
                ctaOnClick={staff.length === 0 ? openCreate : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Member</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Branch</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u, idx) => {
                    const branch = branchMap[u.branch_id];
                    const avatar = ((u.name || "?").charAt(0)).toUpperCase();
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleTone(u.role)} text-white font-bold flex items-center justify-center shadow-md`}>
                              {avatar}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">{u.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.mail }} />
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-gradient-to-r ${roleTone(u.role)} text-white shadow-sm`}>
                            {ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">
                              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.shield }} />
                              System-wide
                            </span>
                          ) : branch ? (
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.branches }} />
                              <span className="font-medium text-slate-700">{branch.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={u.status === "inactive" ? "inactive" : "active"} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                            >
                              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.edit }} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(u.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring"
                            >
                              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.trash }} />
                              Remove
                            </button>
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

        {openForm && (
          <Modal onClose={() => setOpenForm(false)} title={editingId ? "Edit staff member" : "Add staff member"}>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Full name" error={errors.name}>
                <input className="input-field" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Doe" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className="input-field" type="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} placeholder="jane@rxconnect.com" />
              </Field>
              {!editingId && (
                <Field label="Password" error={errors.password}>
                  <input className="input-field" type="password" value={formData.password} onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" />
                </Field>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Role" error={errors.role}>
                  <select className="input-field !py-2.5" value={formData.role} onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Branch" error={errors.branch_id} disabled={formData.role === "admin"}>
                  <select
                    className="input-field !py-2.5"
                    value={formData.branch_id}
                    disabled={formData.role === "admin"}
                    onChange={(e) => setFormData((f) => ({ ...f, branch_id: e.target.value }))}
                  >
                    <option value="">{formData.role === "admin" ? "Not applicable" : "Choose a branch"}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
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
                  {editingId ? "Save changes" : "Create staff"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {confirmDelete !== null && (
          <Modal onClose={() => setConfirmDelete(null)} title="Remove staff member">
            <p className="text-sm text-slate-600">
              This will permanently remove the staff member from your organisation.
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
                Yes, remove
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, error, children, disabled }) {
  return (
    <label className={`block ${disabled ? "opacity-60" : ""}`}>
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
