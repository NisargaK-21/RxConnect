"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../services/auth.service";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const data = await login({
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      alert("Login successful!");

      const role = data.user.role;

      switch (role) {
        case "admin":
          router.push("/dashboard");
          break;
      
        case "customer":
          router.push("/catalog");
          break;
      
        case "staff":
          router.push("/orders");
          break;
      
        case "pharmacist":
          router.push("/review-prescriptions");
          break;
      
        case "delivery":
          router.push("/order-tracking");
          break;
      
        default:
          router.push("/");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

      <br />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button type="submit">
        Login
      </button>
    </form>
  );
}