"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function BranchStockDashboard() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchBranches() {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branches`);

      setBranches(response.data);
      
      if (response.data.length > 0) {
        setSelectedBranch(response.data[0].id);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load branches");
    }
  }

  async function fetchStock(branchId) {
    try {
      const response = await axios.get(
        `http://localhost:5000/stock?branchId=${branchId}`
      );

      setStock(response.data.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchStock(selectedBranch);
    }
  }, [selectedBranch]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Branch Stock Overview</h1>

      <br />

      <label>
        Select Branch:{" "}
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>

      <br />
      <br />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Quantity</th>
            <th>Low Stock Threshold</th>
          </tr>
        </thead>

        <tbody>
          {stock.map((item) => (
            <tr key={item.id}>
              <td>{item.medicine_name}</td>
              <td>{item.quantity}</td>
              <td>{item.low_stock_threshold}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <button
        onClick={() => (window.location.href = "/dashboard/low-stock")}
      >
        View Low Stock Dashboard
      </button>

      <button
        style={{ marginLeft: "10px" }}
        onClick={() => alert("Threshold configuration coming soon")}
      >
        Configure Threshold
      </button>
    </div>
  );
}