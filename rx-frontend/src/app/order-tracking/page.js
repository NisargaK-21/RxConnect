"use client";

import { useEffect, useState } from "react";

export default function OrderTrackingPage() {
  const customerId = 1; // Change if needed

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:5000/orders/customer/${customerId}`
      );

      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Failed to fetch orders.");
    }

    setLoading(false);
  };

  const fetchOrderDetails = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/orders/${id}`);
      const data = await res.json();

      if (data.success) {
        setSelectedOrder(data);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error fetching order details.");
    }
  };

const cancelOrder = async (id) => {
  try {
    const res = await fetch(
      `http://localhost:5000/orders/${id}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId,
        }),
      }
    );

    const data = await res.json();

    alert(data.message);

    if (data.success) {
      fetchOrders();

      if (selectedOrder && selectedOrder.order.id === id) {
        setSelectedOrder(null);
      }
    }
  } catch (err) {
    console.error(err);
    alert("Failed to cancel order.");
  }
};

  useEffect(() => {
  fetchOrders();

  const interval = setInterval(() => {
    fetchOrders();
  }, 10000); // Refresh every 10 seconds

  return () => clearInterval(interval);
}, []);
  return (
    <div style={{ padding: "30px" }}>
      <h1>Customer Order Tracking</h1>

      <button onClick={fetchOrders}>Refresh Orders</button>

      <br />
      <br />

      {loading && <p>Loading...</p>}

      {message && <p>{message}</p>}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid gray",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            <p>
              <b>Order ID:</b> {order.id}
            </p>

            <p>
              <b>Status:</b> {order.status}
            </p>

            <p>
              <b>Branch:</b> {order.branch_id}
            </p>

            <p>
              <b>Created:</b> {order.created_at}
            </p>

            <button onClick={() => fetchOrderDetails(order.id)}>
              View Details
            </button>

            {"  "}

            <button
              onClick={() => cancelOrder(order.id)}
              style={{ marginLeft: "10px" }}
            >
              Cancel Order
            </button>
          </div>
        ))
      )}

      {selectedOrder && (
        <div
          style={{
            marginTop: "30px",
            border: "2px solid black",
            padding: "20px",
          }}
        >
          <h2>Order Details</h2>

          <p>
            <b>Order ID:</b> {selectedOrder.order.id}
          </p>

          <p>
            <b>Status:</b> {selectedOrder.order.status}
          </p>

          <h3>Medicines</h3>

          {selectedOrder.items.length === 0 ? (
            <p>No medicines found.</p>
          ) : (
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                </tr>
              </thead>

              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.medicine_name}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}