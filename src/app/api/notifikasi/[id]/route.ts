import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH: Mark a single notification as read
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notifId = parseInt(id);
  if (isNaN(notifId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await db.update(notifikasi)
    .set({ is_dibaca: true })
    .where(
      and(
        eq(notifikasi.id, notifId),
        eq(notifikasi.id_penerima, session.user.id_pegawai)
      )
    );

  return NextResponse.json({ success: true });
}
