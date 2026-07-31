"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
console.log("Medicine Details Page Loaded");

export default function MedicineDetails({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const branchId = searchParams.get("branchId") || "1";

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
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