"use client";

import { useState } from "react";

export default function OrdersPage() {
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState(null);

  const placeOrder = async () => {
    setMessage("");
    setSuggestion(null);

    const response = await fetch("http://localhost:5000/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: Number(customerId),
        branchId: Number(branchId),
        items: [
          {
            medicineId: Number(medicineId),
            quantity: Number(quantity),
          },
        ],
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      setMessage(data.message);
      return;
    }

    if (response.status === 409) {
      setMessage(data.message);
      setSuggestion(data.suggestion);
      return;
    }

    setMessage(data.message || "Something went wrong");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Place Order</h1>

      <br />

      <input
        type="number"
        placeholder="Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Branch ID"
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Medicine ID"
        value={medicineId}
        onChange={(e) => setMedicineId(e.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <br />
      <br />

      <button onClick={placeOrder}>
        Place Order
      </button>

      <br />
      <br />

      {message && (
        <h3>{message}</h3>
      )}

      {suggestion && (
        <div
          style={{
            border: "1px solid black",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <h3>Alternative Branch Available</h3>

          <p>
            <strong>Branch:</strong> {suggestion.branchName}
          </p>

          <p>
            <strong>Available Quantity:</strong>{" "}
            {suggestion.availableQuantity}
          </p>

          <button>
            Request Pharmacist Approval
          </button>
        </div>
      )}

      {message &&
        !suggestion &&
        message.includes("out of stock") && (
          <p>No alternative branch has sufficient stock.</p>
        )}
    </div>
  );
}