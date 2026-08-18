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

const REJECTION_REASONS = [
  "Prescription Expired (> 6 months from issue date)",
  "Dosage / Strength / Quantity Mismatch",
  "Doctor's Signature / Medical Registration Stamp Missing",
  "Illegible / Low Quality / Blurry Document",
  "Medicine Name Mismatch with Prescribed Item",
  "Patient Name / Identity Mismatch",
  "Controlled Substance - Special Regulatory Approval Required",
  "Other Reason (Specify below)",
];

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
  
  // Side-by-side inspection modal state
  const [inspectingItem, setInspectingItem] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Mandatory rejection state
  const [rejectingItem, setRejectingItem] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReasonNote, setCustomReasonNote] = useState("");

  async function refresh(showToast = false) {
    try {
      const res = await api.get("/prescriptions/pending");
      const list = res.data?.data || res.data?.prescriptions || [];
      setPrescriptions(Array.isArray(list) ? list : []);
      if (showToast) toast("Pending prescription list refreshed", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load pending prescriptions", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    refresh(false);
    const interval = setInterval(() => refresh(false), 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function openInspector(item) {
    setInspectingItem(item);
    setZoomLevel(1);
    setRotation(0);
  }

  function closeInspector() {
    setInspectingItem(null);
    setZoomLevel(1);
    setRotation(0);
  }

  function startReject(item) {
    setRejectingItem(item);
    setSelectedReason("");
    setCustomReasonNote("");
  }

  function closeReject() {
    setRejectingItem(null);
    setSelectedReason("");
    setCustomReasonNote("");
  }

  async function handleApprove(id) {
    setBusyId(id);
    try {
      await api.patch(`/prescriptions/${id}/review`, { status: "approved" });
      toast(`Prescription #${id} approved successfully! Order marked as Verified.`, {
        variant: "success",
      });
      closeInspector();
      refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to approve prescription", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectSubmit() {
    if (!rejectingItem) return;

    if (!selectedReason) {
      toast("Please select a reason for rejecting the prescription.", { variant: "warning" });
      return;
    }

    if (selectedReason === "Other Reason (Specify below)" && !customReasonNote.trim()) {
      toast("Please provide details for the rejection reason.", { variant: "warning" });
      return;
    }

    const finalReason =
      selectedReason === "Other Reason (Specify below)"
        ? `Other: ${customReasonNote.trim()}`
        : customReasonNote.trim()
        ? `${selectedReason} - ${customReasonNote.trim()}`
        : selectedReason;

    const id = rejectingItem.prescription_id || rejectingItem.id;
    setBusyId(id);

    try {
      await api.patch(`/prescriptions/${id}/review`, {
        status: "rejected",
        reason: finalReason,
      });
      toast(`Prescription #${id} rejected. Reason: ${selectedReason}`, {
        variant: "warning",
      });
      closeReject();
      closeInspector();
      refresh(false);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to reject prescription", {
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return prescriptions;
    return prescriptions.filter((p) =>
      String(p.prescription_id || p.id || "").includes(q) ||
      String(p.order_id || "").includes(q) ||
      (p.customer_name || "").toLowerCase().includes(q) ||
      (p.medicine_name || "").toLowerCase().includes(q)
    );
  }, [prescriptions, q]);

  const totals = useMemo(
    () => ({
      total: prescriptions.length,
      uniqueMeds: new Set(prescriptions.map((p) => p.medicine_name).filter(Boolean)).size,
      ordersAwaiting: new Set(prescriptions.map((p) => p.order_id).filter(Boolean)).size,
    }),
    [prescriptions]
  );

  return (
    <AppShell activeRoute="/review-prescriptions">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Pharmacist Verification Station
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Review Prescriptions
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Inspect uploaded doctor prescriptions side-by-side with order details before dispensing medicines.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => refresh(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span
                className="w-4 h-4"
                dangerouslySetInnerHTML={{ __html: ICONS.refresh }}
              />
              Refresh Queue
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          <StatCard
            title="Pending Verification"
            value={loading ? null : totals.total}
            icon={ICONS.prescriptions}
            accent="amber"
            loading={loading}
          />
          <StatCard
            title="Orders on Hold"
            value={loading ? null : totals.ordersAwaiting}
            icon={ICONS.orders}
            accent="indigo"
            loading={loading}
          />
          <StatCard
            title="Unique Medicines"
            value={loading ? null : totals.uniqueMeds}
            icon={ICONS.pill}
            accent="teal"
            loading={loading}
          />
          <StatCard
            title="Verification Status"
            value={loading ? null : totals.total > 0 ? "Action Required" : "All Clear"}
            icon={ICONS.shield}
            accent={totals.total > 0 ? "violet" : "emerald"}
            loading={loading}
          />
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-6 card-hover">
          <div className="relative">
            <span
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              dangerouslySetInnerHTML={{ __html: ICONS.search }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Prescription ID, Order ID, Patient Name, or Medicine..."
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        {/* Prescriptions Table Queue */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SkeletonTable rows={6} columns={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 px-5">
            <EmptyState
              icon="prescriptions"
              title={prescriptions.length === 0 ? "Prescription queue is clear" : "No matching prescriptions found"}
              description={
                prescriptions.length === 0
                  ? "All customer prescriptions have been reviewed and verified."
                  : "Try clearing search filters."
              }
              variant="success"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden stagger">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50/70 border-b border-slate-100">
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Rx ID</th>
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Patient / Customer</th>
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Prescribed Medicine</th>
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Quantity</th>
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Document</th>
                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p, idx) => {
                    const id = p.prescription_id || p.id;
                    const isBusy = busyId === id;
                    return (
                      <tr
                        key={id || idx}
                        className="hover:bg-slate-50/80 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                          #{id}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-700">
                          #{p.order_id || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0 font-bold text-xs">
                              {p.customer_name ? p.customer_name[0].toUpperCase() : "C"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">
                                {p.customer_name || `Customer #${p.customer_id || "—"}`}
                              </div>
                              <div className="text-xs text-slate-400">ID #{p.customer_id || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                              <span
                                className="w-4 h-4"
                                dangerouslySetInnerHTML={{ __html: ICONS.pill }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{p.medicine_name || "—"}</div>
                              <div className="text-[11px] text-slate-400">Medicine #{p.medicine_id || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800 tabular-nums">
                          {p.quantity || 1} units
                        </td>
                        <td className="px-5 py-4">
                          {p.file_url ? (
                            <button
                              type="button"
                              onClick={() => openInspector(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                            >
                              <span
                                className="w-3.5 h-3.5 text-slate-600"
                                dangerouslySetInnerHTML={{ __html: ICONS.eye }}
                              />
                              Inspect Document
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No document</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => openInspector(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 btn-press transition focus-ring"
                            >
                              Side-by-Side Review
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(id)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 btn-press transition focus-ring disabled:opacity-60 shadow-xs"
                            >
                              {isBusy ? (
                                <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              ) : (
                                <span
                                  className="w-3.5 h-3.5"
                                  dangerouslySetInnerHTML={{ __html: ICONS.check }}
                                />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => startReject(p)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 btn-press transition focus-ring disabled:opacity-60 border border-rose-100"
                            >
                              <span
                                className="w-3.5 h-3.5"
                                dangerouslySetInnerHTML={{ __html: ICONS.close }}
                              />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Side-by-Side Prescription & Order Inspection Modal */}
        {inspectingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={closeInspector}
            />

            <div className="relative w-full max-w-6xl h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col animate-modal-in overflow-hidden">
              {/* Inspection Header */}
              <header className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <span
                      className="w-5 h-5"
                      dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }}
                    />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                      Prescription Verification #{inspectingItem.prescription_id || inspectingItem.id}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Side-by-side inspection: Order #{inspectingItem.order_id} · Patient: {inspectingItem.customer_name || `ID #${inspectingItem.customer_id}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeInspector}
                  className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors focus-ring"
                >
                  <span
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: ICONS.close }}
                  />
                </button>
              </header>

              {/* Side-by-side Split View Container */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
                {/* Left Side: Document Visualizer (7 cols) */}
                <div className="lg:col-span-7 bg-slate-950 p-4 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
                  {/* Visualizer Top Bar Controls */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800/80 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Uploaded Document
                    </span>

                    <div className="flex items-center gap-1 bg-slate-900/90 rounded-xl p-1 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                        className="px-2.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-bold transition-colors"
                        title="Zoom Out"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono text-[11px] text-slate-300 font-bold">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                        className="px-2.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-bold transition-colors"
                        title="Zoom In"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-1"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="px-2 py-1 rounded-lg text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        title="Rotate 90 deg"
                      >
                        ↻ Rotate
                      </button>
                    </div>
                  </div>

                  {/* Document Display Area */}
                  <div className="flex-1 overflow-auto rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-center p-3 relative">
                    {inspectingItem.file_url ? (
                      inspectingItem.file_url.toLowerCase().endsWith(".pdf") ? (
                        <iframe
                          src={assetUrl(inspectingItem.file_url)}
                          title="Prescription PDF Document"
                          className="w-full h-full rounded-xl border-0 bg-white"
                        />
                      ) : (
                        <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
                          <img
                            src={assetUrl(inspectingItem.file_url)}
                            alt="Uploaded Prescription Document"
                            style={{
                              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                              transformOrigin: "center center",
                              transition: "transform 0.15s ease-out",
                            }}
                            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-xl"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center text-slate-400 p-8">
                        <span
                          className="w-10 h-10 block mx-auto text-slate-600 mb-2"
                          dangerouslySetInnerHTML={{ __html: ICONS.search }}
                        />
                        <p className="text-sm font-semibold">No Document Uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* External viewer button */}
                  {inspectingItem.file_url && (
                    <div className="pt-3 text-right">
                      <a
                        href={assetUrl(inspectingItem.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <span
                          className="w-3.5 h-3.5"
                          dangerouslySetInnerHTML={{ __html: ICONS.eye }}
                        />
                        Open Full Resolution in New Tab
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Side: Order & Medicine Info Details (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between overflow-y-auto p-6 space-y-5 bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Verification Status
                        </span>
                        <div className="mt-0.5">
                          <StatusBadge status={inspectingItem.status || "Pending"} size="md" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Order Reference
                        </span>
                        <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                          Order #{inspectingItem.order_id}
                        </div>
                      </div>
                    </div>

                    {/* Patient & Customer Info */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Patient / Customer Profile
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name</span>
                          <span className="font-bold text-slate-900">{inspectingItem.customer_name || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer ID</span>
                          <span className="font-mono font-bold text-slate-900">#{inspectingItem.customer_id}</span>
                        </div>
                        {inspectingItem.branch_id && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fulfillment Branch</span>
                            <span className="font-semibold text-slate-800">Branch #{inspectingItem.branch_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescribed Medicine Information */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                          Ordered Prescription Item
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          Rx Required
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-base font-bold text-slate-900">
                          {inspectingItem.medicine_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Medicine ID: #{inspectingItem.medicine_id}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quantity</span>
                          <span className="font-bold text-slate-900 text-sm tabular-nums">
                            {inspectingItem.quantity || 1} units
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                          <span className="font-bold text-amber-700">Awaiting Verification</span>
                        </div>
                      </div>
                    </div>

                    {/* Pharmacist Instructions & Policy checklist */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1.5">
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                        Pharmacist Verification Checklist
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                        <li>Verify patient name matches prescription.</li>
                        <li>Verify doctor credentials & signature are present.</li>
                        <li>Check prescription date is within valid regulatory validity (6 months).</li>
                        <li>Ensure requested dosage corresponds to prescribed item.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Verification Actions in Side-by-Side View */}
                  <div className="pt-4 border-t border-slate-100 space-y-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApprove(inspectingItem.prescription_id || inspectingItem.id)}
                      disabled={busyId === (inspectingItem.prescription_id || inspectingItem.id)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 hover:from-emerald-600 hover:to-teal-700 btn-press transition focus-ring disabled:opacity-60"
                    >
                      {busyId === (inspectingItem.prescription_id || inspectingItem.id) ? (
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span
                          className="w-4 h-4"
                          dangerouslySetInnerHTML={{ __html: ICONS.check }}
                        />
                      )}
                      Approve Prescription & Confirm Order
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const it = inspectingItem;
                        startReject(it);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 btn-press transition focus-ring"
                    >
                      <span
                        className="w-4 h-4"
                        dangerouslySetInnerHTML={{ __html: ICONS.close }}
                      />
                      Reject Prescription (Requires Reason)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Rejection Reason Modal */}
        {rejectingItem && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={closeReject}
            />

            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-modal-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <span
                      className="w-5 h-5"
                      dangerouslySetInnerHTML={{ __html: ICONS.close }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Reject Prescription #{rejectingItem.prescription_id || rejectingItem.id}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select a mandatory clinical rejection reason before proceeding.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeReject}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <span
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: ICONS.close }}
                  />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-800">
                  <strong>Warning:</strong> Rejecting this prescription will release reserved stock, mark Order #{rejectingItem.order_id} as Rejected, and notify the customer.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Clinical Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {REJECTION_REASONS.map((r) => (
                      <label
                        key={r}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedReason === r
                            ? "bg-rose-50/70 border-rose-400 text-rose-950 font-semibold shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="rejectionReason"
                          value={r}
                          checked={selectedReason === r}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Additional Notes / Clarification for Patient{" "}
                    {selectedReason === "Other Reason (Specify below)" && (
                      <span className="text-rose-500">* (Required)</span>
                    )}
                  </label>
                  <textarea
                    rows={3}
                    value={customReasonNote}
                    onChange={(e) => setCustomReasonNote(e.target.value)}
                    placeholder="Enter details explaining the rejection or steps the customer must take..."
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={closeReject}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
                >
                  Keep for Review
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={
                    !selectedReason ||
                    (selectedReason === "Other Reason (Specify below)" && !customReasonNote.trim()) ||
                    busyId === (rejectingItem.prescription_id || rejectingItem.id)
                  }
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-md shadow-rose-600/20 btn-press transition focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busyId === (rejectingItem.prescription_id || rejectingItem.id) ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span
                      className="w-3.5 h-3.5"
                      dangerouslySetInnerHTML={{ __html: ICONS.close }}
                    />
                  )}
                  Confirm Prescription Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
