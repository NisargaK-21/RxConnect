"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import StatusBadge from "@/components/StatusBadge";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ICONS } from "@/lib/navigation";
import { getUser } from "@/utils/auth";
import { toast } from "@/components/Toast";
import { useCart } from "@/context/CartContext";
import { uploadPrescription } from "@/services/prescription.service";

export default function CustomerPage() {
  return (
    <RequireAuth allowedRoles={["customer", "admin", "staff", "pharmacist"]}>
      <CustomerInner />
    </RequireAuth>
  );
}

function CustomerInner() {
  const router = useRouter();
  const user = getUser();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } =
    useCart();

  const [medicines, setMedicines] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [uploadingRx, setUploadingRx] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [medRes, branchRes] = await Promise.all([
          api.get("/catalog"),
          api.get("/branches"),
        ]);
        if (cancelled) return;
        const mList = Array.isArray(medRes.data) ? medRes.data : medRes.data?.data || [];
        const bList = Array.isArray(branchRes.data) ? branchRes.data : branchRes.data?.data || [];
        setMedicines(mList);
        setBranches(bList);
        if (bList.length > 0 && !selectedBranch) {
          setSelectedBranch(String(bList[0].id));
        }
      } catch (err) {
        if (!cancelled) toast("Failed to load catalog data", { variant: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      const matchSearch =
        !q ||
        (m.name || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q);
      const needRx = Boolean(m.requires_prescription);
      const matchType =
        typeFilter === "all" ||
        (typeFilter === "rx" && needRx) ||
        (typeFilter === "otc" && !needRx);
      return matchSearch && matchType;
    });
  }, [medicines, search, typeFilter]);

  const hasRxItemsInCart = useMemo(() => {
    return cart.some((item) => item.requires_prescription);
  }, [cart]);

  async function handleCheckout() {
    if (!selectedBranch) {
      toast("Please select a pickup / fulfillment branch", { variant: "warning" });
      return;
    }
    if (cart.length === 0) {
      toast("Your cart is empty", { variant: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: Number(user?.id || 1),
        branchId: Number(selectedBranch),
        items: cart.map((item) => ({
          medicineId: Number(item.medicineId),
          quantity: item.quantity,
        })),
      };

      const res = await api.post("/orders", payload);
      const orderData = res.data || {};
      setPlacedOrder(orderData);
      clearCart();

      const rxItem = orderData.items?.find((it) => it.requiresPrescription);
      if (rxItem) {
        toast("Order placed! Please upload your prescription now.", {
          variant: "info",
          title: "Prescription required",
        });
      } else {
        toast("Order placed successfully!", { variant: "success" });
        setTimeout(() => router.push("/order-tracking"), 1200);
      }
    } catch (err) {
      toast(err?.response?.data?.message || "Checkout failed. Please try again.", {
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadPrescription() {
    if (!placedOrder || !prescriptionFile) {
      toast("Please select a prescription file", { variant: "warning" });
      return;
    }

    const rxItem = placedOrder.items?.find((it) => it.requiresPrescription);
    if (!rxItem) {
      toast("No prescription item found in this order", { variant: "error" });
      return;
    }

    setUploadingRx(true);
    try {
      await uploadPrescription(rxItem.orderItemId, prescriptionFile);
      toast("Prescription uploaded successfully!", { variant: "success" });
      setTimeout(() => router.push("/order-tracking"), 1000);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to upload prescription", {
        variant: "error",
      });
    } finally {
      setUploadingRx(false);
    }
  }

  return (
    <AppShell activeRoute="/customer">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Customer Ordering Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Pharmacy Store & Cart
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Browse genuine medicines, manage your cart, and place orders with instant fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/order-tracking"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-teal-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 btn-press transition focus-ring"
            >
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ICONS.tracking }} />
              Track My Orders
            </Link>
          </div>
        </div>

        {/* Main Grid: Products + Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Products & Filter */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filter bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 card-hover">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: ICONS.search }}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search medicine by name or formula..."
                    className="input-field w-full pl-10"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { key: "all", label: "All" },
                    { key: "otc", label: "OTC" },
                    { key: "rx", label: "Prescription" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTypeFilter(opt.key)}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition btn-press focus-ring ${
                        typeFilter === opt.key
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent shadow-md shadow-teal-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Medicine Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <SkeletonCard lines={4} />
                  </div>
                ))}
              </div>
            ) : filteredMedicines.length === 0 ? (
              <EmptyState
                icon="catalog"
                title="No medicines match"
                description="Try modifying your search or filter options."
                ctaLabel="Clear search"
                ctaOnClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredMedicines.map((m) => {
                  const needRx = Boolean(m.requires_prescription);
                  const price = Number(m.price || 0);
                  const cartItem = cart.find((it) => Number(it.medicineId) === Number(m.id));
                  const inCartQty = cartItem?.quantity || 0;

                  return (
                    <div
                      key={m.id}
                      className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover flex flex-col justify-between"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600 border border-teal-100 flex items-center justify-center shadow-xs">
                            <span
                              className="w-6 h-6"
                              dangerouslySetInnerHTML={{ __html: ICONS.pill }}
                            />
                          </div>
                          <div className="flex flex-col items-end">
                            <StatusBadge
                              status={needRx ? "Verified" : "Active"}
                              size="sm"
                            />
                            {needRx && (
                              <span className="mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                Rx Required
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/catalog/${m.id}`}
                          className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 block text-base"
                        >
                          {m.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                          {m.description || (needRx ? "Prescription required medicine" : "Over-the-counter wellness product")}
                        </p>
                      </div>

                      <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-400">
                            Price
                          </div>
                          <div className="text-lg font-bold text-slate-900 tabular-nums">
                            ₹{price.toLocaleString()}
                          </div>
                        </div>

                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(m.id, inCartQty - 1)}
                              className="w-7 h-7 rounded-lg bg-white text-teal-700 flex items-center justify-center font-bold shadow-xs hover:bg-teal-100 transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-teal-800 px-1 tabular-nums">
                              {inCartQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(m.id, inCartQty + 1)}
                              className="w-7 h-7 rounded-lg bg-white text-teal-700 flex items-center justify-center font-bold shadow-xs hover:bg-teal-100 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(m, 1)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
                          >
                            <span
                              className="w-3.5 h-3.5"
                              dangerouslySetInnerHTML={{ __html: ICONS.plus }}
                            />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Cart & Checkout */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 card-hover sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <span
                      className="w-4 h-4"
                      dangerouslySetInnerHTML={{ __html: ICONS.cart }}
                    />
                  </div>
                  <h2 className="font-bold text-slate-900 text-base">Your Shopping Cart</h2>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Branch Selector */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Fulfillment Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="input-field w-full py-2.5"
                >
                  <option value="">Select nearest branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address || "Main Branch"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-5">
                  <span
                    className="w-8 h-8 mx-auto text-slate-400 block mb-2"
                    dangerouslySetInnerHTML={{ __html: ICONS.cart }}
                  />
                  <p className="text-xs font-semibold text-slate-600">Your cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select medicines from the catalog to build your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 mb-5 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div
                      key={item.medicineId}
                      className="pt-3 first:pt-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>₹{item.price} each</span>
                          {item.requires_prescription && (
                            <span className="text-[10px] text-indigo-600 bg-indigo-50 font-semibold px-1.5 py-0.2 rounded border border-indigo-100">
                              Rx Required
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-slate-800 px-1.5 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-white text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.medicineId)}
                          className="w-7 h-7 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <span
                            className="w-4 h-4"
                            dangerouslySetInnerHTML={{ __html: ICONS.trash }}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Total & Prescription warning */}
              {cart.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  {hasRxItemsInCart && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-800">
                      <span
                        className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: ICONS.prescriptions }}
                      />
                      <span>
                        Contains prescription medicine. You can upload your prescription after placing order.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      ₹{cartTotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={submitting || cart.length === 0 || !selectedBranch}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700 btn-press transition focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span
                        className="w-4 h-4"
                        dangerouslySetInnerHTML={{ __html: ICONS.arrowRight }}
                      />
                    )}
                    {submitting ? "Processing Checkout..." : "Place Order Now"}
                  </button>
                </div>
              )}

              {/* Prescription Upload Section after Order Placement */}
              {placedOrder && (
                <div className="mt-6 pt-5 border-t border-slate-200 bg-teal-50/50 p-4 rounded-2xl border border-teal-100 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-sm mb-2">
                    <span
                      className="w-4 h-4 text-teal-600"
                      dangerouslySetInnerHTML={{ __html: ICONS.check }}
                    />
                    Order #{placedOrder.order?.id || placedOrder.id || "Created"}
                  </div>

                  {placedOrder.items?.some((it) => it.requiresPrescription) ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        This order requires a doctor's prescription for approval.
                      </p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                      />
                      <button
                        type="button"
                        onClick={handleUploadPrescription}
                        disabled={!prescriptionFile || uploadingRx}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 btn-press transition disabled:opacity-50"
                      >
                        {uploadingRx ? "Uploading..." : "Submit Prescription"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Order confirmed. Redirecting to tracking...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
