import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate trend data for last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, "0");
    const firstDay = `${year}-${monthStr}-01`;
    const lastDay = `${year}-${monthStr}-${new Date(year, month, 0).getDate()}`;

    const monthData = await db
      .select()
      .from(absensi)
      .where(
        and(
          gte(absensi.tanggal, firstDay),
          lte(absensi.tanggal, lastDay)
        )
      );

    const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    months.push({
      bulan: namaBulan[month - 1],
      hadir: monthData.filter((a) => a.status_masuk === "Hadir").length,
      terlambat: monthData.filter((a) => a.status_masuk === "Terlambat").length,
    });
  }

  return NextResponse.json(months);
}
