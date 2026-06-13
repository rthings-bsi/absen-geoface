import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai, jabatan, pengajuan } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  // Total pegawai
  const totalPegawai = await db.select({ count: count() }).from(pegawai);
  const totalCount = totalPegawai[0]?.count || 0;

  // Today's absensi
  const todayAbsensi = await db
    .select()
    .from(absensi)
    .where(eq(absensi.tanggal, today));

  const hadirHariIni = todayAbsensi.filter((a) => a.status_masuk === "Hadir").length;
  const terlambatHariIni = todayAbsensi.filter((a) => a.status_masuk === "Terlambat").length;

  // Today's approved pengajuan (izin/sakit)
  const todayPengajuan = await db
    .select()
    .from(pengajuan)
    .where(
      and(
        eq(pengajuan.status, "Disetujui"),
        lte(pengajuan.tanggal_mulai, today),
        gte(pengajuan.tanggal_selesai, today)
      )
    );
  const izinHariIni = todayPengajuan.length;

  return NextResponse.json({
    total_pegawai: totalCount,
    hadir_hari_ini: hadirHariIni,
    terlambat_hari_ini: terlambatHariIni,
    izin_hari_ini: izinHariIni,
    alpa_hari_ini: Math.max(0, totalCount - hadirHariIni - terlambatHariIni - izinHariIni),
  });
}
