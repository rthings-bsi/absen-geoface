import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Single JOIN: recent absensi with pegawai info
  const aktivitas = await db
    .select({
      id: absensi.id,
      pegawai_nama: pegawai.nama,
      jam_masuk: absensi.jam_masuk,
      status_masuk: absensi.status_masuk,
      tanggal: absensi.tanggal,
    })
    .from(absensi)
    .leftJoin(pegawai, eq(absensi.id_pegawai, pegawai.id))
    .orderBy(desc(absensi.id))
    .limit(10);

  return NextResponse.json(
    aktivitas.map((a) => ({
      id: a.id,
      pegawai_nama: a.pegawai_nama || "Unknown",
      aksi: `${a.status_masuk === "Hadir" ? "✅" : "⚠️"} Absen ${a.status_masuk === "Hadir" ? "masuk (Hadir)" : "masuk (Terlambat)"} jam ${a.jam_masuk?.slice(0, 5) || "--:--"}`,
      waktu: a.tanggal,
    }))
  );
}
