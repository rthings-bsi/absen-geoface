import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Untuk Vercel (serverless), gunakan prepared statements: false
// SSL required for Supabase from Vercel
const client = postgres(connectionString, {
  prepare: false,
  ssl: { rejectUnauthorized: false },
  idle_timeout: 5,
  max_lifetime: 60,
});
export const db = drizzle(client, { schema });
export type DbClient = typeof db;
