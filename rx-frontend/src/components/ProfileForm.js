"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
} from "@/services/user.service";
import { getToken } from "@/utils/auth";

export default function ProfileForm() {

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function fetchProfile() {
    try {
      const token = getToken();

      const res = await getProfile(token);

      setName(res.data.name);
      setPhone(res.data.phone || "");
      setAddress(res.data.address || "");
    } catch (err) {
      alert("Failed to load profile");
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getToken();
        const res = await getProfile(token);
        if (cancelled) return;
        setName(res.data.name);
        setPhone(res.data.phone || "");
        setAddress(res.data.address || "");
      } catch (err) {
        if (!cancelled) alert("Failed to load profile");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {

      const token = getToken();

      await updateProfile(
        {
          name,
          phone,
          address,
        },
        token
      );

      alert("Profile updated");

    } catch (err) {
      alert(err.response?.data?.message);
    }
  }

  return (
    <div>

      <h1>My Profile</h1>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <br /><br />

        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Update Profile
        </button>

      </form>

    </div>
  );
}