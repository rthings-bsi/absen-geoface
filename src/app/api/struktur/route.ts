import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { struktur_organisasi, pegawai, jabatan } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: struktur_organisasi.id,
      nama: struktur_organisasi.nama,
      id_parent: struktur_organisasi.id_parent,
      id_pegawai_kepala: struktur_organisasi.id_pegawai_kepala,
      level: struktur_organisasi.level,
      urutan: struktur_organisasi.urutan,
      kepala_nip: pegawai.nip,
      kepala_nama: pegawai.nama,
      kepala_jabatan_nama: jabatan.nama,
    })
    .from(struktur_organisasi)
    .leftJoin(pegawai, eq(struktur_organisasi.id_pegawai_kepala, pegawai.id))
    .leftJoin(jabatan, eq(pegawai.id_jabatan, jabatan.id))
    .orderBy(asc(struktur_organisasi.level), asc(struktur_organisasi.urutan));

  const data = rows.map(({ kepala_nip, kepala_nama, kepala_jabatan_nama, ...rest }) => ({
    ...rest,
    pegawai_kepala: kepala_nama
      ? {
          nip: kepala_nip,
          nama: kepala_nama,
          jabatan: kepala_jabatan_nama ? { nama: kepala_jabatan_nama } : null,
        }
      : null,
  }));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const inserted = await db.insert(struktur_organisasi).values({
    nama: body.nama,
    id_parent: body.parent_id || body.id_parent || null,
    level: 0,
    urutan: 0,
  }).returning() as any[];
  const newItem = inserted[0];

  return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  const body = await request.json();
  await db.update(struktur_organisasi)
    .set({ nama: body.nama })
    .where(eq(struktur_organisasi.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  // Delete children first
  await db.delete(struktur_organisasi).where(eq(struktur_organisasi.id_parent, id));
  await db.delete(struktur_organisasi).where(eq(struktur_organisasi.id, id));
  return NextResponse.json({ success: true });
}
