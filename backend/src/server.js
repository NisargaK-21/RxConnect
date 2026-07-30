const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./database/db");
const path = require("path");

const authRoutes = require("./auth/auth.routes");
const notificationRoutes = require("./notifications/notification.routes");
const stockRoutes = require("./stock/stock.routes");

const authenticate = require("./middleware/auth.middleware");
const authorize = require("./middleware/role.middleware");
const branchRoutes = require("./branches/branch.routes");
const catalogRoutes = require("./catalog/catalog.routes");
const prescriptionRoutes = require("./prescriptions/prescription.routes");
const orderRoutes = require("./orders/order.routes");
const userRoutes = require("./users/users.routes");
const dashboardRoutes = require("./dashboard/dashboard.routes");


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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});