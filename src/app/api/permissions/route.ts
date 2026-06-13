import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { permissions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const data = await db.query.permissions.findMany({
    orderBy: [asc(permissions.grup), asc(permissions.nama)],
  });
  return NextResponse.json(data);
}
