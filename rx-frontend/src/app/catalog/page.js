"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CatalogPage() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMedicines = async (searchText = "") => {
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/catalog?search=${searchText}`
      );

      const data = await res.json();

      if (data.success) {
        setMedicines(data.data);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchMedicines(value);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Medicine Catalog</h1>

      <br />

      <input
        type="text"
        placeholder="Search medicine..."
        value={search}
        onChange={handleSearch}
        style={{
          width: "300px",
          padding: "8px",
          marginBottom: "20px",
        }}
      />

      {loading ? (
        <p>Loading...</p>
      ) : medicines.length === 0 ? (
        <p>No medicines found.</p>
      ) : (
        medicines.map((medicine) => (
          <div
            key={medicine.id}
            style={{
              border: "1px solid gray",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
            }}
          >
            <h3>{medicine.name}</h3>

            <p>₹ {medicine.price}</p>

            {medicine.requires_prescription ? (
              <p style={{ color: "red", fontWeight: "bold" }}>
                Prescription Required
              </p>
            ) : (
              <p style={{ color: "green", fontWeight: "bold" }}>
                OTC Medicine
              </p>
            )}

            <Link href={`/catalog/${medicine.id}?branchId=1`}>
              <button>View Details</button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}