"use client";

import { useEffect, useState } from "react";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/services/user.service";
import { getToken } from "@/utils/auth";

import StaffTable from "./StaffTable";

export default function StaffForm() {
  const [staff, setStaff] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [branchId, setBranchId] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const token = getToken();

      const res = await getStaff(token);

      setStaff(res.data);
    } catch (err) {
      alert("Failed to load staff");
    }
  }

  function handleEdit(user) {
    setEditingId(user.id);

    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setBranchId(user.branch_id || "");

    setPassword("");
  }

  async function handleDelete(id) {
    try {
      const token = getToken();

      await deleteStaff(id, token);

      alert("Staff deleted");

      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = getToken();

      if (editingId) {
        await updateStaff(
          editingId,
          {
            name,
            email,
            role,
            branch_id: Number(branchId),
          },
          token
        );

        alert("Staff updated");
      } else {
        await createStaff(
          {
            name,
            email,
            password,
            role,
            branch_id: Number(branchId),
          },
          token
        );

        alert("Staff created");
      }

      setEditingId(null);

      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      setBranchId("");

      fetchStaff();

    } catch (err) {
      alert(err.response?.data?.message);
    }
  }

  return (
    <div>

      <h1>Staff Management</h1>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        {!editingId && (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />
          </>
        )}

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="staff">Staff</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="delivery">Delivery</option>
          <option value="admin">Admin</option>
        </select>

        <br /><br />

        <input
          type="number"
          placeholder="Branch ID"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          {editingId ? "Update Staff" : "Add Staff"}
        </button>

      </form>

      <br />

      <StaffTable
        staff={staff}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

    </div>
  );
}