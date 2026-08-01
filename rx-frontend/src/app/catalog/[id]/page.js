"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { SkeletonCard } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";
import { uploadPrescription } from "@/services/prescription.service";

export default function MedicineDetails({ params }) {
  return (
    <RequireAuth allowedRoles={["admin", "customer", "staff", "pharmacist"]}>
      <MedicineDetailsInner params={params} />
    </RequireAuth>
  );
}
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
console.log("Medicine Details Page Loaded");

export default function MedicineDetails({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

function MedicineDetailsInner({ params }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefBranch = searchParams.get("branchId");

  const [medicine, setMedicine] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(prefBranch || "");
  const [branchLoadError, setBranchLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPrescription, setUploadedPrescription] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const branchRes = await api.get("/branches");
        if (cancelled) return;
        const list = Array.isArray(branchRes.data)
          ? branchRes.data
          : branchRes.data?.data || [];
        setBranches(list);
        const selectedBranch = prefBranch || String(list[0]?.id || "");
        if (selectedBranch) {
          setBranchId(selectedBranch);
          setBranchLoadError(false);
        }
      } catch (err) {
        if (!cancelled) {
          toast("Failed to load medicine branches", { variant: "error" });
          setBranches([]);
          setBranchId(prefBranch || "");
          setBranchLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, prefBranch]);

  useEffect(() => {
    if (!id) return;
    if (!branchId) {
      setLoading(false);
      setMedicine(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/catalog/${id}`, { params: { branchId } });
        if (!cancelled) setMedicine(res.data?.data || res.data || null);
      } catch (err) {
        if (!cancelled) toast("Failed to load medicine", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId, id]);

  async function refreshBranches() {
    setLoading(true);
    setBranchLoadError(false);
    try {
      const res = await api.get("/branches");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setBranches(list);
      const selectedBranch = prefBranch || String(list[0]?.id || "");
      if (selectedBranch) setBranchId(selectedBranch);
    } catch (err) {
      toast("Failed to load medicine branches", { variant: "error" });
      setBranchLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  const needRx = Boolean(medicine?.requires_prescription);
  const stock = Number(medicine?.branch_stock ?? medicine?.stock ?? 0);
  const inStock = stock > 0;
  const lowStock = inStock && stock <= (Number(medicine?.low_stock_threshold) || 5);

  async function handleQuickOrder() {
    if (!inStock) return;
    setSubmitting(true);
    try {
      const res = await api.post("/orders", {
        branchId: Number(branchId),
        items: [
          {
            medicineId: Number(id),
            quantity: qty,
          },
        ],
      });

      const data = res.data || {};
      setOrderResult(data);
      setUploadedPrescription(data.prescription || null);

      if (needRx) {
        toast("Order created. Upload your prescription to continue.", {
          variant: "info",
          title: "Prescription required",
        });
        return;
      }

      toast(data.message || "Order placed", { variant: "success", title: "Success" });
      router.push("/order-tracking");
    } catch (err) {
      if (err?.response?.status === 409 && err.response.data?.medicineSuggestion) {
        toast("Substitution available", { variant: "warning" });
        return;
      }
      toast(err?.response?.data?.message || "Failed to place order", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadPrescription() {
    if (!orderResult || !prescriptionFile) {
      toast("Select a prescription file first", { variant: "warning" });
      return;
    }

    const rxItem = orderResult.items?.find((item) => item.requiresPrescription);
    if (!rxItem) {
      toast("No prescription item found for this order", { variant: "error" });
      return;
    }

    setUploading(true);
    try {
      const response = await uploadPrescription(rxItem.orderItemId, prescriptionFile);
      setUploadedPrescription(response?.data?.data || response?.data || null);
      toast("Prescription uploaded successfully", { variant: "success" });
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to upload prescription", { variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell activeRoute="/catalog">
      <div className="animate-fade-in-up">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/catalog" className="hover:text-teal-700 transition-colors">
            Catalog
          </Link>
          <span className="w-3.5 h-3.5 text-slate-400" dangerouslySetInnerHTML={{ __html: ICONS.chevronRight }} />
          <span className="text-slate-900 font-medium truncate">
            {loading ? "Loading..." : medicine?.name || "Not found"}
          </span>
        </nav>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SkeletonCard lines={6} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SkeletonCard lines={5} />
            </div>
          </div>
        ) : !medicine ? (
          !branchId ? (
            <EmptyState
              icon="catalog"
              title={branchLoadError ? "Failed to load branches" : "Select a branch"}
              description={
                branchLoadError
                  ? "Unable to load branches. Check your network or authentication, then retry."
                  : "Please select a branch to view availability for this medicine."
              }
              variant={branchLoadError ? "error" : "info"}
              ctaLabel="Retry branches"
              ctaOnClick={refreshBranches}
            />
          ) : (
            <EmptyState
              icon="catalog"
              title="Medicine not found"
              description="The medicine you're looking for doesn't exist."
              variant="warning"
              ctaLabel="Back to catalog"
              ctaHref="/catalog"
            />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="relative px-6 pt-8 pb-6 bg-linear-to-br from-teal-50 via-white to-emerald-50 border-b border-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm">
                        <span className="w-9 h-9" dangerouslySetInnerHTML={{ __html: ICONS.pill }} />
                      </div>
                      <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                          {medicine.name}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge
                            status={needRx ? "Verified" : "Active"}
                            size="md"
                          />
                          {needRx && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 font-semibold">
                              <span className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }} />
                              Prescription Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Price
                      </div>
                      <div className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
                        ₹{Number(medicine.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      Description
                    </h2>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                      {medicine.description || "No detailed description provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoTile label="Formulation" value={medicine.formulation || "—"} icon={ICONS.pill} />
                    <InfoTile label="Manufacturer" value={medicine.manufacturer || "—"} icon={ICONS.factory || ICONS.catalog} />
                    <InfoTile label="Salt Composition" value={medicine.salt || medicine.composition || "—"} icon={ICONS.shield} />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  Safety & Guidance
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                  {[
                    "Take as prescribed by your physician.",
                    "Store below 25°C and away from direct sunlight.",
                    "Keep out of reach of children.",
                    needRx ? "Do not share your prescription with others." : "Read the label carefully before use.",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="mt-0.5 w-5 h-5 shrink-0 text-emerald-600" dangerouslySetInnerHTML={{ __html: ICONS.check }} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 card-hover sticky top-24">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  Availability
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Branch
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="input-field py-2.5! w-full"
                  >
                    {branches.length === 0 && <option value="">No branches</option>}
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-500">Stock</div>
                  <div className="flex items-center gap-2">
                    {inStock ? (
                      <StatusBadge status={lowStock ? "pending" : "delivered"} size="sm" />
                    ) : (
                      <StatusBadge status="Cancelled" size="sm" />
                    )}
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{stock}</span>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      inStock
                        ? lowStock
                          ? "bg-linear-to-r from-amber-500 to-orange-500"
                          : "bg-linear-to-r from-emerald-500 to-teal-500"
                        : "bg-linear-to-r from-slate-300 to-slate-400"
                    }`}
                    style={{
                      width: `${Math.max(2, Math.min(100, stock * 2))}%`,
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Quantity
                  </label>
                  <div className="flex items-stretch rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1 || !inStock}
                      className="w-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.minus }} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={inStock ? stock : 1}
                      value={qty}
                      onChange={(e) =>
                        setQty(Math.max(1, Math.min(inStock ? stock : 1, Number(e.target.value) || 1)))
                      }
                      className="w-full text-center font-semibold text-slate-900 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(inStock ? stock : 1, q + 1))}
                      disabled={!inStock || qty >= stock}
                      className="w-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.plus }} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-slate-50 to-white border border-slate-100 mb-5">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    ₹{(Number(medicine.price || 0) * qty).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleQuickOrder}
                  disabled={!inStock || submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-linear-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.orders }} />
                  )}
                  {submitting ? "Placing..." : inStock ? "Place Quick Order" : "Out of Stock"}
                </button>

                {orderResult && needRx && (
                  <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="text-sm font-semibold text-slate-900 mb-3">
                      Prescription required for this medicine
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                          Upload prescription
                        </label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,application/pdf"
                          onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-slate-700"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleUploadPrescription}
                        disabled={!prescriptionFile || uploading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-linear-to-r from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600 btn-press transition focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.upload }} />
                        )}
                        {uploading ? "Uploading..." : "Upload prescription"}
                      </button>
                      <p className="text-xs text-slate-500">
                        After upload, the order remains in review until a pharmacist approves it.
                      </p>
                    </div>
                  </div>
                )}

                <Link
                  href="/orders"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
                >
                  <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.cart }} />
                  Go to full order form
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}
    const fetchMedicine = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/catalog/${id}?branchId=${branchId}`
        );

        const data = await res.json();

        if (data.success) {
          setMedicine(data.data);
        } else {
          setMedicine(null);
        }
      } catch (error) {
        console.error("Error fetching medicine:", error);
        setMedicine(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id, branchId]);

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Medicine not found.</h2>
      </div>
    );
  }

function InfoTile({ label, value, icon }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2 text-slate-500 mb-1.5">
        <span className="w-4 h-4 text-teal-600" dangerouslySetInnerHTML={{ __html: icon }} />
        <span className="text-xs uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900 leading-snug min-h-5">{value}</div>
    <div style={{ padding: "30px" }}>
      <h1>{medicine.name}</h1>

      <p>
        <strong>Description:</strong> {medicine.description}
      </p>

      <p>
        <strong>Price:</strong> ₹{medicine.price}
      </p>

      <p>
        <strong>Prescription Required:</strong>{" "}
        {medicine.requires_prescription ? "Yes" : "No"}
      </p>

      <p>
        <strong>Available Stock:</strong> {medicine.branch_stock}
      </p>

      {medicine.branch_stock > 0 ? (
        <p style={{ color: "green", fontWeight: "bold" }}>In Stock</p>
      ) : (
        <p style={{ color: "red", fontWeight: "bold" }}>Out of Stock</p>
      )}

      <button
  disabled={medicine.branch_stock === 0}
  onClick={() =>
    router.push(
      `/orders/place?medicineId=${medicine.id}&branchId=${branchId}`
    )
  }
  style={{
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor:
      medicine.branch_stock > 0 ? "#2563eb" : "#9ca3af",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: medicine.branch_stock > 0 ? "pointer" : "not-allowed",
  }}
>
  {medicine.branch_stock > 0 ? "Order Now" : "Out of Stock"}
</button>
    </div>
  );
}
