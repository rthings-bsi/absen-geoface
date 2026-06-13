import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jam_kerja } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const data = await db.query.jam_kerja.findMany();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.nama || !body.jam_masuk) {
      return NextResponse.json({ error: "Nama dan jam masuk wajib diisi" }, { status: 400 });
    }

    const jkResult = await db.insert(jam_kerja).values({
      nama: body.nama,
      jam_masuk: body.jam_masuk,
      jam_pulang: body.jam_keluar || body.jam_pulang,
      toleransi_terlambat: parseInt(body.toleransi_terlambat) || 30,
      hari_kerja: body.hari_kerja || "senin-jumat",
      aktif: body.aktif !== undefined ? body.aktif : true,
      keterangan: body.keterangan || null,
    }).returning() as any[];
    const newJK = jkResult[0];

    return NextResponse.json(newJK, { status: 201 });
  } catch (err: any) {
    console.error("POST jam-kerja error:", err);
    return NextResponse.json({ error: "Gagal menyimpan jam kerja" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ error: "ID jam kerja diperlukan" }, { status: 400 });
  }

  try {
    const body = await request.json();
    await db.update(jam_kerja)
      .set({
        nama: body.nama,
        jam_masuk: body.jam_masuk,
        jam_pulang: body.jam_keluar || body.jam_pulang,
        toleransi_terlambat: parseInt(body.toleransi_terlambat) || 30,
        hari_kerja: body.hari_kerja || "senin-jumat",
        aktif: body.aktif !== undefined ? body.aktif : true,
        keterangan: body.keterangan || null,
      })
      .where(eq(jam_kerja.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT jam-kerja error:", err);
    return NextResponse.json({ error: "Gagal memperbarui jam kerja" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) {
      return NextResponse.json({ error: "ID jam kerja diperlukan" }, { status: 400 });
    }

    await db.delete(jam_kerja).where(eq(jam_kerja.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE jam-kerja error:", err);
    return NextResponse.json({ error: "Gagal menghapus jam kerja" }, { status: 500 });
  }
}
