import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai, jabatan } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Single JOIN: get today's absensi with pegawai data
  const todayAbsensi = await db
    .select({
      id: absensi.id,
      id_pegawai: absensi.id_pegawai,
      tanggal: absensi.tanggal,
      jam_masuk: absensi.jam_masuk,
      jam_pulang: absensi.jam_pulang,
      status_masuk: absensi.status_masuk,
      status_pulang: absensi.status_pulang,
      pegawai_nip: pegawai.nip,
      pegawai_nama: pegawai.nama,
      pegawai_role: pegawai.role,
    })
    .from(absensi)
    .leftJoin(pegawai, eq(absensi.id_pegawai, pegawai.id))
    .where(eq(absensi.tanggal, today));

  // Single query: get all pegawai with jabatan (no N+1)
  const allPegawai = await db
    .select({
      id: pegawai.id,
      nip: pegawai.nip,
      nama: pegawai.nama,
      role: pegawai.role,
      jabatan_nama: jabatan.nama,
    })
    .from(pegawai)
    .leftJoin(jabatan, eq(pegawai.id_jabatan, jabatan.id))
    .where(eq(pegawai.role, "Pegawai"));

  // Map untuk reshape
  const reshapedAbsensi = todayAbsensi.map(
    ({ pegawai_nip, pegawai_nama, pegawai_role, ...rest }) => ({
      ...rest,
      pegawai: {
        nip: pegawai_nip,
        nama: pegawai_nama,
        role: pegawai_role,
      },
    })
  );

  const absensiPegawaiIds = new Set(todayAbsensi.map((a) => a.id_pegawai));

  const terlambat = reshapedAbsensi.filter((a) => a.status_masuk === "Terlambat");
  const tidakAbsen = allPegawai
    .filter((p) => !absensiPegawaiIds.has(p.id))
    .map(({ jabatan_nama, ...rest }) => ({
      ...rest,
      jabatan: jabatan_nama ? { nama: jabatan_nama } : null,
    }));

  return NextResponse.json({
    hadir: reshapedAbsensi.filter((a) => a.status_masuk === "Hadir").length,
    terlambat,
    tidak_absen: tidakAbsen,
    total_pegawai: allPegawai.length,
  });
}
