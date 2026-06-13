import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const month = parseInt(searchParams.get("month") || String(nowWib.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(nowWib.getFullYear()));

  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const data = await db
    .select()
    .from(absensi)
    .where(
      and(
        eq(absensi.id_pegawai, session.user.id_pegawai),
        gte(absensi.tanggal, firstDay),
        lte(absensi.tanggal, lastDay)
      )
    )
    .orderBy(desc(absensi.tanggal));

  const rekap = {
    hadir: data.filter((a) => a.status_masuk === "Hadir").length,
    terlambat: data.filter((a) => a.status_masuk === "Terlambat").length,
    izin: 0,
    sakit: 0,
    cuti: 0,
    alpa: 0,
    total: data.length,
  };

  return NextResponse.json({ absensi: data, rekap });
}
