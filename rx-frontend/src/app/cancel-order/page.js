"use client";

import { useState } from "react";

export default function CancelOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!orderId || !customerId) {
      setMessage("Please enter both Order ID and Customer ID.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: Number(customerId),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ " + data.message);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Unable to connect to backend.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f8",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "25px" }}>
          RxConnect
        </h1>

        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
          Cancel Customer Order
        </h3>

        <label>Order ID</label>

        <input
          type="number"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter Order ID"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        />

        <label>Customer ID</label>

        <input
          type="number"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Enter Customer ID"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            marginBottom: "20px",
          }}
        />

        <button
          onClick={handleCancel}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {loading ? "Cancelling..." : "Cancel Order"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "20px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

