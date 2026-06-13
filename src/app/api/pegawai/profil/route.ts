import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai, users, jabatan, jam_kerja } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET: Get own profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({
      id: pegawai.id,
      id_user: pegawai.id_user,
      nip: pegawai.nip,
      nama: pegawai.nama,
      tempat_lahir: pegawai.tempat_lahir,
      tanggal_lahir: pegawai.tanggal_lahir,
      jenis_kelamin: pegawai.jenis_kelamin,
      no_hp: pegawai.no_hp,
      alamat: pegawai.alamat,
      id_jabatan: pegawai.id_jabatan,
      id_jam_kerja: pegawai.id_jam_kerja,
      id_role: pegawai.id_role,
      id_struktur: pegawai.id_struktur,
      face_data: pegawai.face_data,
      face_registered: pegawai.face_registered,
      foto: pegawai.foto_profile,
      role: pegawai.role,
      jabatan_nama: jabatan.nama,
      jam_kerja_nama: jam_kerja.nama,
      jam_kerja_masuk: jam_kerja.jam_masuk,
      jam_kerja_pulang: jam_kerja.jam_pulang,
      jam_kerja_toleransi: jam_kerja.toleransi_terlambat,
    })
    .from(pegawai)
    .leftJoin(jabatan, eq(pegawai.id_jabatan, jabatan.id))
    .leftJoin(jam_kerja, eq(pegawai.id_jam_kerja, jam_kerja.id))
    .where(eq(pegawai.id, session.user.id_pegawai));

  if (!row) {
    return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
  }

  const data = {
    ...row,
    jabatan: row.jabatan_nama ? {
      id: row.id_jabatan,
      nama: row.jabatan_nama,
    } : null,
    jam_kerja: row.jam_kerja_nama ? {
      id: row.id_jam_kerja,
      nama: row.jam_kerja_nama,
      jam_masuk: row.jam_kerja_masuk,
      jam_pulang: row.jam_kerja_pulang,
      toleransi_terlambat: row.jam_kerja_toleransi,
    } : null,
  };

  // Clean flat aliases
  delete (data as any).jabatan_nama;
  delete (data as any).jam_kerja_nama;
  delete (data as any).jam_kerja_masuk;
  delete (data as any).jam_kerja_pulang;
  delete (data as any).jam_kerja_toleransi;

  return NextResponse.json(data);
}

// PUT: Update own profile
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { no_hp, alamat } = body;

  await db.update(pegawai)
    .set({ no_hp, alamat })
    .where(eq(pegawai.id, session.user.id_pegawai));

  return NextResponse.json({ success: true });
}
