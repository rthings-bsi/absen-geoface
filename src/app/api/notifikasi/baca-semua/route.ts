import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST: Mark all notifications as read for current user
export async function POST() {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.update(notifikasi)
    .set({ is_dibaca: true })
    .where(eq(notifikasi.id_penerima, session.user.id_pegawai));

  return NextResponse.json({ success: true });
}
