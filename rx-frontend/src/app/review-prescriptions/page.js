"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function ReviewPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/prescriptions/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     


      setPrescriptions(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load prescriptions");
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const reviewPrescription = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/prescriptions/${id}/review`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      alert("Failed to update prescription");
    }
  };
  if (prescriptions.length === 0) {
  return (
    <div style={{ padding: "30px" }}>
      <h1>Pending Prescriptions</h1>
      <p>No pending prescriptions.</p>
    </div>
  );
}

  return (
    <div style={{ padding: "30px" }}>
      <h1>Pending Prescriptions</h1>
        
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Medicine</th>
            <th>Quantity</th>
            <th>Image</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {prescriptions.map((p) => (
<tr key={p.prescription_id}>              <td>{p.prescription_id}</td>
              <td>{p.customer_name}</td>
              <td>{p.medicine_name}</td>
              <td>{p.quantity}</td>
              <td>
                <a
                  href={p.file_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              </td>
              <td>
                <button
                  onClick={() => reviewPrescription(p.prescription_id, "approved")}
                >
                  Approve
                </button>

                <button
                  onClick={() => reviewPrescription(p.prescription_id, "rejected")}
                  style={{ marginLeft: "10px" }}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}