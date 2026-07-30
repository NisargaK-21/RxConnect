"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function FulfillmentDashboard() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchFulfillment() {
    try {
      const response = await axios.get(
        "http://localhost:5000/dashboard/fulfillment"
      );

      setBranches(response.data.data);
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.log(error.response.data);
      }

      alert("Failed to load fulfillment dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFulfillment();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Branch Fulfillment Dashboard</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Branch</th>
            <th>Total Orders</th>
            <th>Delivered Orders</th>
            <th>Fulfillment Rate</th>
          </tr>
        </thead>

        <tbody>
          {branches.map((branch) => (
            <tr key={branch.branchId}>
              <td>{branch.branchName}</td>
              <td>{branch.totalOrders}</td>
              <td>{branch.deliveredOrders}</td>
              <td>{branch.fulfillmentRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}