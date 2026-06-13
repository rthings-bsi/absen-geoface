import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id_pegawai = session.user.id_pegawai;
  const today = new Date().toISOString().split("T")[0];

  // Get today's absensi
  const todayAbsensi = await db.query.absensi.findFirst({
    where: and(
      eq(absensi.id_pegawai, id_pegawai),
      eq(absensi.tanggal, today)
    ),
  });

  // Get pegawai face registration status
  const pegawaiData = await db.query.pegawai.findFirst({
    where: eq(pegawai.id, id_pegawai),
  });

  return NextResponse.json({
    sudah_masuk: !!todayAbsensi?.jam_masuk,
    sudah_pulang: !!todayAbsensi?.jam_pulang,
    absensi_hari_ini: todayAbsensi || null,
    face_registered: pegawaiData?.face_registered || false,
  });
}
