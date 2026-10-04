import { Pool } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "rxconnect",
  user: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || ""),
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
});

export { pool };
export default pool;