const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "rxconnect",
  user: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || ""),
  // Allow the connection pool size to be configured (e.g. higher during
  // concurrency stress tests). Defaults to pg's standard 10.
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
});

module.exports = pool;