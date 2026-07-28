const express = require("express");
const dotenv = require("dotenv");
const pool = require("./database/db");

dotenv.config();

const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});