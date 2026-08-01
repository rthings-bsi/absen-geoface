import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const isPostgres = (process.env.DATABASE_URL || "")
  .toLowerCase()
  .startsWith("postgres");

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
