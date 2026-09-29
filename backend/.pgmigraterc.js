require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;
const isSupabase = databaseUrl && /supabase\.(com|co)/i.test(databaseUrl);

module.exports = {
  databaseUrl: isSupabase
    ? {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        family: 6,
      }
    : databaseUrl,
  dir: "migrations",
};