import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET: Get notifications for current user
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  const data = await db.query.notifikasi.findMany({
    where: eq(notifikasi.id_penerima, session.user.id_pegawai),
    orderBy: desc(notifikasi.created_at),
    limit,
  });

  return NextResponse.json(data);
}
