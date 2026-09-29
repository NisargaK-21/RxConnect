import express from "express";
import cors from "cors";
import dotenv from"dotenv";
import pool from "./database/db";
import path from "path";

import authRoutes from "./auth/auth.routes";
import notificationRoutes from "./notifications/notification.routes";
import stockRoutes from "./stock/stock.routes";

import authenticate from "./middleware/auth.middleware";
import authorize from "./middleware/role.middleware";
import branchRoutes from "./branches/branch.routes";
import catalogRoutes from "./catalog/catalog.routes";
import prescriptionRoutes from "./prescriptions/prescription.routes";
import orderRoutes from "./orders/order.routes";
import userRoutes from "./users/users.routes";
import dashboardRoutes from "./dashboard/dashboard.routes";
import { getRecurringFulfillmentFailures } from "./dashboard/dashboard.controller";
import deliveryRoutes from "./delivery/delivery.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use("/auth", authRoutes);
app.use("/notifications", notificationRoutes);

app.use("/stock", stockRoutes);
app.use("/branches", branchRoutes);
app.use("/catalog", catalogRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/prescriptions", prescriptionRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/delivery", deliveryRoutes);

pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Database Connection Failed");
    console.error(err);
  } else {
    console.log("PostgreSQL Connected");
    console.log(result.rows[0]);
  }
});

app.get("/", (req, res) => {
  res.send("RxConnect Backend Running");
});

app.get(
  "/admin",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({
      message: "Welcome Admin",
      user: req.user,
    });
  }
);

app.get(
  "/admin/fulfillment-failures",
  authenticate,
  authorize("admin"),
  getRecurringFulfillmentFailures
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});