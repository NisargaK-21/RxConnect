"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MedicineDetails({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();

  const branchId = searchParams.get("branchId") || "1";

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/catalog/${id}?branchId=${branchId}`)
      .then((res) => res.json())
      .then((data) => {
        setMedicine(data.data);
        setLoading(false);
      });
  }, [id, branchId]);

  if (loading) return <h2>Loading...</h2>;

  if (!medicine) return <h2>Medicine not found</h2>;

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
        <p style={{ color: "green" }}>In Stock</p>
      ) : (
        <p style={{ color: "red" }}>Out of Stock</p>
      )}

      <button disabled={medicine.branch_stock === 0}>
        Add to Cart
      </button>
    </div>
  );
}