import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Gunakan better-sqlite3 untuk file-based SQLite (Node.js only, no edge runtime)
const sqlitePath = path.resolve(process.cwd(), process.env.DATABASE_URL?.replace("file:", "") || "data/absensi.db");
const sqlite = new Database(sqlitePath);

// Performance optimizations
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("cache_size = -20000"); // 20MB page cache
sqlite.pragma("busy_timeout = 5000"); // 5s busy timeout
sqlite.pragma("synchronous = NORMAL"); // faster than FULL, safe with WAL

export const db = drizzle(sqlite, { schema });
export type DbClient = typeof db;
