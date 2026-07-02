import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Auto-detect: SQLite (file:) atau PostgreSQL
let db: any;

if (connectionString.startsWith("file:")) {
  // SQLite local
  const sqlitePath = connectionString.replace("file:", "");
  const sqliteDb = new Database(sqlitePath);
  db = drizzleSqlite(sqliteDb, { schema });
} else {
  // PostgreSQL (Supabase / production)
  const client = postgres(connectionString, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    idle_timeout: 20,
    max_lifetime: 300,
    connect_timeout: 10,
  });
  db = drizzle(client, { schema });
}

export { db };
export type DbClient = typeof db;
