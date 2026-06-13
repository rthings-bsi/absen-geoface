import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const data = await db.query.absensi.findFirst({
    where: and(
      eq(absensi.id_pegawai, session.user.id_pegawai),
      eq(absensi.tanggal, today)
    ),
  });

  return NextResponse.json({
    masuk: data?.jam_masuk || null,
    pulang: data?.jam_pulang || null,
    status: data ? (data.status_masuk || "hadir") : "Belum Absen",
  });
}