"use client";

import { useEffect, useState } from "react";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/services/branch.service";
import { getToken } from "@/utils/auth";

import BranchTable from "./BranchTable";

export default function BranchForm() {
  const [branches, setBranches] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    try {
      const token = getToken();

      const res = await getBranches(token);

      setBranches(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load branches");
    }
  }

  function handleEdit(branch) {
    setEditingId(branch.id);

    setName(branch.name);
    setAddress(branch.address);
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Delete this branch?"
    );

    if (!confirmDelete) return;

    try {
      const token = getToken();

      await deleteBranch(id, token);

      alert("Branch deleted");

      fetchBranches();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to delete branch"
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = getToken();

      if (editingId) {
        await updateBranch(
          editingId,
          {
            name,
            address,
          },
          token
        );

        alert("Branch updated");
      } else {
        await createBranch(
          {
            name,
            address,
          },
          token
        );

        alert("Branch created");
      }

      setEditingId(null);
      setName("");
      setAddress("");

      fetchBranches();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Operation failed"
      );
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Branch Management</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Branch Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
        />

        <br />
        <br />

        <button type="submit">
          {editingId
            ? "Update Branch"
            : "Add Branch"}
        </button>
      </form>

      <br />

      <BranchTable
        branches={branches}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}