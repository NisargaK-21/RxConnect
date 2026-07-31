"use client";

import { useEffect, useState } from "react";
import DashboardNav from "@/components/DashboardNav";
import axios from "axios";

export default function LowStockDashboard() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(
          "http://localhost:5000/dashboard/lowstock"
        );

        setBranches(response.data.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load low stock dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Low Stock Dashboard</h1>

      <DashboardNav/>

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

          {branch.lowStockItems.length === 0 ? (
            <p>No low stock medicines.</p>
          ) : (
            <table border="1" cellPadding="10">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Acknowledged</th>
                </tr>
              </thead>

              <tbody>
                {branch.lowStockItems.map((item) => (
                  <tr key={item.alertId}>
                    <td>{item.medicineName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.threshold}</td>
                    <td>{item.acknowledged ? "Yes" : "No"}</td>
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