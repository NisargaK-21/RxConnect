"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "../services/auth.service";

export default function SignupForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const data = await signup(formData);

      alert(data.message || "Signup successful!");

      router.push("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Signup</h2>

      <br />

      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
      />

      <br /><br />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />

      <br /><br />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
      />

      <br /><br />

      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
      >
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
        <option value="pharmacist">Pharmacist</option>
        <option value="delivery">Delivery</option>
      </select>

      <br /><br />

      <button type="submit">
        Signup
      </button>
    </form>
  );
}