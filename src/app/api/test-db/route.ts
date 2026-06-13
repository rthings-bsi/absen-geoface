import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
    return NextResponse.json({
      ok: true,
      db_url_set: !!process.env.DATABASE_URL,
      db_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      users: allUsers,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      db_url_set: !!process.env.DATABASE_URL,
      db_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    }, { status: 500 });
  }
}
