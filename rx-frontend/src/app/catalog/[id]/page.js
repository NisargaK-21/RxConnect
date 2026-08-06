"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { SkeletonCard } from "@/components/Skeleton";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { toast } from "@/components/Toast";
import { useCart } from "@/context/CartContext";
import { uploadPrescription } from "@/services/prescription.service";

export default function MedicineDetailsPage() {
  return (
    <RequireAuth allowedRoles={["admin", "customer", "staff", "pharmacist"]}>
      <MedicineDetailsInner />
    </RequireAuth>
  );
}

function MedicineDetailsInner() {
  const params = useParams();
  const id = params?.id;

  const searchParams = useSearchParams();
  const router = useRouter();
  const prefBranch = searchParams.get("branchId");
  const { addToCart } = useCart();

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const branchRes = await api.get("/branches");
        if (cancelled) return;
        const list = Array.isArray(branchRes.data)
          ? branchRes.data
          : branchRes.data?.data || [];
        setBranches(list);
        if (!branchId && list.length > 0) {
          setBranchId(String(list[0].id));
        }
      } catch (err) {
        if (!cancelled) {
          toast("Failed to load branches", { variant: "error" });
          setBranches([]);
          setBranchLoadError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefBranch]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const paramsObj = branchId ? { branchId } : {};
        const res = await api.get(`/catalog/${id}`, { params: paramsObj });
        if (!cancelled) {
          setMedicine(res.data?.data || res.data || null);
        }
      } catch (err) {
        if (!cancelled) toast("Failed to load medicine details", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId, id]);

  const needRx = Boolean(medicine?.requires_prescription);
  const stock = Number(medicine?.branch_stock ?? medicine?.stock ?? 10);
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 5;

  async function handleQuickOrder() {
    if (!inStock) return;
    setSubmitting(true);
    try {
      const res = await api.post("/orders", {
        branchId: Number(branchId || 1),
        items: [
          {
            medicineId: Number(id),
            quantity: qty,
          },
        ],
      });

      const data = res.data || {};
      setOrderResult(data);

      if (needRx) {
        toast("Order created. Please upload your prescription now.", {
          variant: "info",
          title: "Prescription required",
        });
        return;
      }

      toast(data.message || "Quick order placed!", { variant: "success" });
      setTimeout(() => router.push("/order-tracking"), 1000);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.substitutionRequired) {
        localStorage.setItem("substitutionData", JSON.stringify(data));
        router.push("/orders/substitution");
        return;
      }

      toast(data?.message || "Failed to place quick order", {
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadPrescription() {
    if (!orderResult || !prescriptionFile) {
      toast("Please select a prescription file first", { variant: "warning" });
      return;
    }

    const rxItem = orderResult.items?.find((item) => item.requiresPrescription);
    if (!rxItem) {
      toast("No prescription item found for this order", { variant: "error" });
      return;
    }

    setUploading(true);
    try {
      await uploadPrescription(rxItem.orderItemId, prescriptionFile);
      toast("Prescription uploaded successfully", { variant: "success" });
      setTimeout(() => router.push("/order-tracking"), 1000);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to upload prescription", {
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleAddToCart() {
    if (!medicine) return;
    addToCart(medicine, qty);
  }

  return (
    <AppShell activeRoute="/catalog">
      <div className="animate-fade-in-up">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/catalog" className="hover:text-teal-700 transition-colors font-medium">
            Catalog
          </Link>
          <span
            className="w-3.5 h-3.5 text-slate-400"
            dangerouslySetInnerHTML={{ __html: ICONS.chevronRight }}
          />
          <span className="text-slate-900 font-bold truncate">
            {loading ? "Loading..." : medicine?.name || "Medicine Details"}
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
          <EmptyState
            icon="catalog"
            title="Medicine not found"
            description="The requested medicine details could not be loaded."
            variant="warning"
            ctaLabel="Return to Catalog"
            ctaHref="/catalog"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover">
                <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-teal-50 via-white to-emerald-50 border-b border-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm">
                        <span
                          className="w-9 h-9"
                          dangerouslySetInnerHTML={{ __html: ICONS.pill }}
                        />
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
                              <span
                                className="w-3.5 h-3.5"
                                dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }}
                              />
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

                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Description & Usage
                    </h2>
                    <p className="mt-2 text-slate-700 leading-relaxed text-sm">
                      {medicine.description ||
                        "Formulated medicine supplied from verified pharmaceutical distributors. Check with your medical practitioner before administration."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                    <InfoTile
                      label="Formulation"
                      value={medicine.formulation || "Tablet / Capsule"}
                      icon={ICONS.pill}
                    />
                    <InfoTile
                      label="Manufacturer"
                      value={medicine.manufacturer || "Certified Pharma"}
                      icon={ICONS.catalog}
                    />
                    <InfoTile
                      label="Salt / Active Ingredient"
                      value={medicine.salt || medicine.composition || "Active Compound"}
                      icon={ICONS.shield}
                    />
                  </div>
                </div>
              </section>

              {/* Safety & Compliance */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 card-hover">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Safety & Storage Instructions
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  {[
                    "Store in a cool, dry place below 25°C.",
                    "Keep out of reach of children.",
                    "Use strictly as prescribed by your medical practitioner.",
                    needRx
                      ? "Requires valid prescription upload during order."
                      : "Over-the-counter medicine for adult use.",
                  ].map((text, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span
                        className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: ICONS.check }}
                      />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sidebar: Availability, Quantity & Order */}
            <aside className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 card-hover sticky top-24">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Stock & Branch Availability
                </h3>

                {/* Branch Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Select Branch
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="input-field w-full py-2.5"
                  >
                    {branches.length === 0 && <option value="">Default Branch</option>}
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-slate-500">Stock Status</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={inStock ? (lowStock ? "pending" : "delivered") : "Cancelled"}
                      size="sm"
                    />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {stock} units
                    </span>
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Quantity
                  </label>
                  <div className="flex items-stretch rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1 || !inStock}
                      className="w-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={inStock ? stock : 1}
                      value={qty}
                      onChange={(e) =>
                        setQty(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))
                      }
                      className="w-full text-center font-bold text-slate-900 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      disabled={!inStock}
                      className="w-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 mb-5">
                  <span className="text-xs font-semibold text-slate-500">Subtotal</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    ₹{(Number(medicine.price || 0) * qty).toLocaleString()}
                  </span>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 btn-press transition focus-ring disabled:opacity-50"
                  >
                    <span
                      className="w-4 h-4"
                      dangerouslySetInnerHTML={{ __html: ICONS.cart }}
                    />
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickOrder}
                    disabled={!inStock || submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span
                        className="w-4 h-4"
                        dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }}
                      />
                    )}
                    {submitting ? "Placing..." : "Place Quick Order"}
                  </button>
                </div>

                {/* Prescription Upload panel if order was placed */}
                {orderResult && needRx && (
                  <div className="mt-5 p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 animate-fade-in-up">
                    <div className="text-xs font-bold text-indigo-900 mb-2">
                      Upload Required Doctor's Prescription
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-700 mb-3"
                    />
                    <button
                      type="button"
                      onClick={handleUploadPrescription}
                      disabled={!prescriptionFile || uploading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Upload Prescription"}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InfoTile({ label, value, icon }) {
  return (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        <span
          className="w-3.5 h-3.5 text-teal-600"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
      </div>
      <div className="text-xs font-bold text-slate-900">{value}</div>
    </div>
  );
}
