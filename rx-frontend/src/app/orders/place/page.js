"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PlaceOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const medicineId = Number(searchParams.get("medicineId"));
  const branchId = Number(searchParams.get("branchId"));

  // Change this later when login is implemented
  const user = JSON.parse(localStorage.getItem("user"));

const customerId = user.id;
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (quantity < 1) {
      alert("Quantity should be at least 1");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

const response = await fetch("http://localhost:5000/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
        body: JSON.stringify({
          customerId,
          branchId,
          items: [
            {
              medicineId,
              quantity,
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
  alert("Order placed successfully!");

  router.push(`/orders?customerId=${customerId}`);
}
else if (data.substitutionRequired) {

  localStorage.setItem(
    "substitutionData",
    JSON.stringify(data)
  );

  router.push("/orders/substitution");
}
else {
  alert(data.message || "Failed to place order");
}
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Place Order</h1>

      <hr />

      <br />

      <p>
        <strong>Medicine ID :</strong> {medicineId}
      </p>

      <p>
        <strong>Branch ID :</strong> {branchId}
      </p>

      <br />

      <label>Customer ID</label>

      <br />

      
      <br />

      <label>Quantity</label>

      <br />

      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        style={{
          width: "250px",
          padding: "10px",
          marginTop: "5px",
          marginBottom: "20px",
        }}
      />

      <br />

      <button
        onClick={placeOrder}
        disabled={loading}
        style={{
          padding: "12px 25px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}