import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("tanggal") || searchParams.get("date") || new Date().toISOString().split("T")[0];

  const rows = await db
    .select({
      id: absensi.id,
      id_pegawai: absensi.id_pegawai,
      tanggal: absensi.tanggal,
      jam_masuk: absensi.jam_masuk,
      jam_pulang: absensi.jam_pulang,
      status_masuk: absensi.status_masuk,
      status_pulang: absensi.status_pulang,
      foto_masuk: absensi.foto_masuk,
      foto_pulang: absensi.foto_pulang,
      confidence_masuk: absensi.confidence_masuk,
      confidence_pulang: absensi.confidence_pulang,
      verification_method: absensi.verification_method,
      ip_address: absensi.ip_address,
      lokasi_masuk: absensi.lokasi_masuk,
      lokasi_pulang: absensi.lokasi_pulang,
      is_face_verified: absensi.is_face_verified,
      pegawai_nip: pegawai.nip,
      pegawai_nama: pegawai.nama,
      pegawai_id_jabatan: pegawai.id_jabatan,
    })
    .from(absensi)
    .leftJoin(pegawai, eq(absensi.id_pegawai, pegawai.id))
    .where(eq(absensi.tanggal, date));

  const data = rows.map(({ pegawai_nip, pegawai_nama, pegawai_id_jabatan, ...rest }) => ({
    ...rest,
    pegawai: {
      nip: pegawai_nip,
      nama: pegawai_nama,
      id_jabatan: pegawai_id_jabatan,
    },
  }));

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID absensi diperlukan" }, { status: 400 });
  }

  const existing = await db.query.absensi.findFirst({
    where: eq(absensi.id, parseInt(id)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Data absensi tidak ditemukan" }, { status: 404 });
  }

  await db.delete(absensi).where(eq(absensi.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
