const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connString = (process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL) 
  ? process.env.TEST_DATABASE_URL 
  : process.env.DATABASE_URL;

const isLocal = connString && (connString.includes("localhost") || connString.includes("127.0.0.1"));
const requiresSSL = connString && (connString.includes("supabase.com") || connString.includes("supabase.co")) && !isLocal;

const pool = connString
  ? new Pool({
      connectionString: connString,
      ssl: requiresSSL ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "rxconnect",
      user: process.env.DB_USER || "postgres",
      password: String(process.env.DB_PASSWORD || ""),
      max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    });

module.exports = pool;