"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Get token and logged-in user from localStorage
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user"))
      : null;

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`http://localhost:5000/orders/${id}`);

      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
        setItems(data.items);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("Cancel this order?")) return;

    try {
      setCancelling(true);

      const res = await fetch(
        `http://localhost:5000/orders/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerId: user.id,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Order Cancelled");

        router.push(`/orders?customerId=${user.id}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <h2>Loading...</h2>;

  if (!order) return <h2>Order not found.</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>Order #{order.id}</h1>

      <hr />
      <br />

      <p>
        <strong>Status:</strong> {order.status}
      </p>

      <p>
        <strong>Customer ID:</strong> {order.customer_id}
      </p>

      <p>
        <strong>Branch ID:</strong> {order.branch_id}
      </p>

      <p>
        <strong>Created At:</strong>{" "}
        {new Date(order.created_at).toLocaleString()}
      </p>

      <br />

      <h2>Medicines</h2>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid gray",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>{item.medicine_name}</h3>

          <p>Quantity: {item.quantity}</p>

          <p>Price: ₹{item.unit_price}</p>
        </div>
      ))}

      {order.status === "Placed" && (
        <button
          onClick={cancelOrder}
          disabled={cancelling}
          style={{
            marginTop: "20px",
            padding: "12px 25px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {cancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
    </div>
  );
}