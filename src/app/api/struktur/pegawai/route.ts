import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai, jabatan } from "@/db/schema";
import { eq, asc, isNull } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: pegawai.id,
      nip: pegawai.nip,
      nama: pegawai.nama,
      jabatan_nama: jabatan.nama,
    })
    .from(pegawai)
    .leftJoin(jabatan, eq(pegawai.id_jabatan, jabatan.id))
    .orderBy(asc(pegawai.nama));

  return NextResponse.json(rows);
}
