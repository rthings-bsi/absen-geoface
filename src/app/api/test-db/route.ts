import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test direct postgres connection (bypass Drizzle)
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL || "", {
      prepare: false,
      ssl: { rejectUnauthorized: false },
      connect_timeout: 10,
    });

    const result = await sql`SELECT id, email FROM users LIMIT 5`;
    await sql.end();

    return NextResponse.json({
      ok: true,
      db_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      users: result,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5),
      cause: error.cause?.message || null,
      db_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    }, { status: 500 });
  }
}
