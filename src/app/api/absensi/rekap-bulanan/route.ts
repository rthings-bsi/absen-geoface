import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pengajuan } from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id_pegawai = session.user.id_pegawai;
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const firstDay = `${nowWib.getFullYear()}-${String(nowWib.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(nowWib.getFullYear(), nowWib.getMonth() + 1, 0).toISOString().split("T")[0];

  // Count absensi this month
  const absensiThisMonth = await db
    .select()
    .from(absensi)
    .where(
      and(
        eq(absensi.id_pegawai, id_pegawai),
        gte(absensi.tanggal, firstDay),
        lte(absensi.tanggal, lastDay)
      )
    );

  // Count pengajuan this month
  const pengajuanThisMonth = await db
    .select()
    .from(pengajuan)
    .where(
      and(
        eq(pengajuan.id_pegawai, id_pegawai),
        eq(pengajuan.status, "Disetujui"),
        gte(pengajuan.tanggal_mulai, firstDay),
        lte(pengajuan.tanggal_mulai, lastDay)
      )
    );

  const hadir = absensiThisMonth.filter((a) => a.status_masuk === "Hadir").length;
  const terlambat = absensiThisMonth.filter((a) => a.status_masuk === "Terlambat").length;
  const cuti = pengajuanThisMonth.filter((p) => p.jenis === "Cuti").length;
  const izin = pengajuanThisMonth.filter((p) => p.jenis === "Izin").length;
  const sakit = pengajuanThisMonth.filter((p) => p.jenis === "Sakit").length;

  // Count working days (Monday-Friday) as total possible
  const totalWorkingDays = countWorkingDays(nowWib.getFullYear(), nowWib.getMonth() + 1);
  const alpa = Math.max(0, totalWorkingDays - hadir - terlambat - cuti - izin - sakit);

  return NextResponse.json({
    hadir,
    terlambat,
    cuti,
    izin,
    sakit,
    alpa,
    total: totalWorkingDays,
  });
}

function countWorkingDays(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
