"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/DashboardCards";
import { SkeletonCard } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { getUser, logout, saveAuth, getToken } from "@/utils/auth";
import { toast } from "@/components/Toast";

const ROLE_LABEL = {
  admin: "Administrator",
  staff: "Branch staff",
  pharmacist: "Pharmacist",
  delivery: "Delivery partner",
  customer: "Customer",
};

const ROLE_GRADIENT = {
  admin: "from-violet-500 to-fuchsia-500 shadow-fuchsia-500/20",
  staff: "from-sky-500 to-blue-500 shadow-blue-500/20",
  pharmacist: "from-teal-500 to-emerald-500 shadow-emerald-500/20",
  delivery: "from-amber-500 to-orange-500 shadow-orange-500/20",
  customer: "from-indigo-500 to-purple-500 shadow-indigo-500/20",
};

export default function ProfilePage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist", "delivery"]}>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState(getUser() || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/users/profile");
        if (cancelled) return;
        const data = res.data?.data || res.data?.user || res.data || {};
        const merged = { ...(user || {}), ...data };
        setUser(merged);
        saveAuth(
          getToken() || "",
          merged
        );
        setName(merged.name || "");
        setEmail(merged.email || "");
        setPhone(merged.phone || "");
        setAddress(merged.address || "");
      } catch (err) {
        toast(err?.response?.data?.message || "Failed to load profile", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = (name || user?.name || user?.email || "Rx")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("") || "U";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast("Name is required", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/users/profile", {
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      const updated = res.data?.data || res.data?.user || {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      setUser(updated);
      saveAuth(getToken() || "", updated);
      toast("Profile updated", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to save", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    toast("Signed out", { variant: "info" });
    router.replace("/login");
  }

  const role = user?.role;
  const grad = ROLE_GRADIENT[role] || ROLE_GRADIENT.customer;
  const formattedRole = ROLE_LABEL[role] || (role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "User");
  const branchValue = user?.branch_id ? `#${user.branch_id}` : "System-wide";
  const profileInitials = {
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  };
  const hasChanges =
    name !== profileInitials.name ||
    phone !== profileInitials.phone ||
    address !== profileInitials.address;
  const resetLabel = hasChanges ? "Reset changes" : "Reset";

  return (
    <AppShell activeRoute="/profile">
      <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My profile</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              View and update your personal details and role settings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-100 rounded-xl shadow-sm hover:bg-rose-100 btn-press transition focus-ring self-start md:self-end"
          >
            <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.logout }} />
            Sign out
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 space-y-6">
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover">
              <div className={`h-28 bg-gradient-to-br ${grad}`} />
              <div className="px-5 pb-5 -mt-10">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${grad} shadow-xl text-white flex items-center justify-center border-4 border-white text-2xl font-bold tracking-wide`}>
                  {initials}
                </div>
                <div className="mt-3">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {loading ? "Loading…" : name || user?.name || "Unnamed user"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">{email || user?.email || "—"}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                    <span className="w-3 h-3" dangerouslySetInnerHTML={{ __html: ICONS.shield }} />
                    {ROLE_LABEL[role] || role || "User"}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 stagger">
                <div className="animate-fade-in-up"><SkeletonCard lines={1} /></div>
                <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}><SkeletonCard lines={1} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 stagger">
                <ProfileTile title="Role" value={role ? String(role).charAt(0).toUpperCase() + String(role).slice(1) : "—"} icon={ICONS.shield} />
                <ProfileTile title="Branch" value={user?.branch_id ? `#${user.branch_id}` : "System-wide"} icon={ICONS.branches} />
                <ProfileTile title="User ID" value={user?.id ? `#${user.id}` : "—"} icon={ICONS.home} />
                <ProfileTile title="Status" value={user?.id ? "Active" : "Guest"} icon={ICONS.check} />
              </div>
            )}
          </section>

          <section className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 card-hover">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 text-teal-600" dangerouslySetInnerHTML={{ __html: ICONS.settings }} />
                  Profile details
                </h3>
                {loading ? (
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                    Loading…
                  </span>
                ) : null}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    placeholder="Dr. A. Kumar"
                    className="input-field"
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={email}
                    disabled
                    placeholder="Read-only"
                    className="input-field bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    placeholder="+91 98765 43210"
                    className="input-field"
                  />
                </Field>
                <Field label="Branch ID">
                  <input
                    value={user?.branch_id ? user.branch_id : "System-wide"}
                    disabled
                    placeholder="Managed by admin"
                    className="input-field bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading}
                      rows={4}
                      placeholder="Delivery / branch address..."
                      className="input-field resize-y"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setName(user?.name || "");
                    setPhone(user?.phone || "");
                    setAddress(user?.address || "");
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                >
                  {resetLabel}
                </button>
                <button
                  type="submit"
                  disabled={loading || saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:via-emerald-600 hover:to-teal-700 btn-press transition focus-ring disabled:opacity-60"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
                  )}
                  Save changes
                </button>
              </div>
            </form>

            <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 card-hover">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 text-violet-600" dangerouslySetInnerHTML={{ __html: ICONS.wallet }} />
                Account summary
              </h3>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info k="User ID" v={user?.id ? `#${user.id}` : "—"} />
                <Info k="Role" v={ROLE_LABEL[role] || role || "—"} />
                <Info k="Created" v={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
                <Info k="Last updated" v={user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : "—"} />
              </dl>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Info({ k, v }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{k}</div>
      <div className="mt-1 text-slate-800 font-medium">{v}</div>
    </div>
  );
}

function ProfileTile({ title, value, icon }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm card-hover animate-fade-in-up">
      <div
        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</div>
        <div className="mt-0.5 text-sm font-bold text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}
