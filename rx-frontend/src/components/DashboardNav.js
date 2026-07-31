"use client";

import Link from "next/link";

export default function DashboardNav() {
  return (
    <div>
      <Link href="/dashboard">Orders</Link>
      <br /><br />

      <Link href="/dashboard/low-stock">Low Stock</Link>
      <br /><br />

      <Link href="/dashboard/fulfillment">Fulfillment</Link>
      <br /><br />

      <Link href="/dashboard/stock">Branch Stock</Link>

      <hr /><br />
    </div>
  );
}