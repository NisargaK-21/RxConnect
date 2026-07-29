const express = require("express");
const dotenv = require("dotenv");
const pool = require("./database/db");

const authRoutes = require("./auth/auth.routes");
const stockRoutes = require("./stock/stock.routes");

const authenticate = require("./middleware/auth.middleware");
const authorize = require("./middleware/role.middleware");
const branchRoutes = require("./branches/branch.routes");
const orderRoutes = require("./orders/order.routes");
const userRoutes = require("./users/users.routes");


dotenv.config();

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/stock", stockRoutes);
app.use("/branches", branchRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);

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