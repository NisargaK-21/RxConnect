"use client";


import { useEffect, useState } from "react";
import DashboardNav from "@/components/DashboardNav";
import DashboardCards from "@/components/DashboardCards";
import NotificationList from "@/components/NotificationList";
import axios from "axios";


export default function DashboardPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`);

      console.log(response.data);

      setBranches(response.data.data);
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.log(error.response.data);
      }

      alert("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Orders Today Per Branch</h1>

      <DashboardNav/>

      <NotificationList userId={4} />
      
       <DashboardCards
            title="Branches"
            value={branches.length}
      />

      {branches.map((branch) => (
        <div
          key={branch.branchId}
          style={{
            border: "1px solid gray",
            padding: "20px",
            marginTop: "20px",
          }}
        >
          <h2>{branch.branchName}</h2>

          <p>
            <strong>Total Orders:</strong> {branch.orderCount}
          </p>


          {branch.orders.length === 0 ? (
            <p>No orders today.</p>
          ) : (
            
            <table border="1" cellPadding="10">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>
                {branch.orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_id}</td>
                    <td>{order.status}</td>
                    <td>{order.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}