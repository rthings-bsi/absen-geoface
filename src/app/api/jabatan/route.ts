import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jabatan, pegawai } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const data = await db.query.jabatan.findMany();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.nama) {
      return NextResponse.json({ error: "Nama jabatan wajib diisi" }, { status: 400 });
    }
    const result = await db.insert(jabatan).values({
      nama: body.nama,
      id_parent: body.id_parent || null,
      deskripsi: body.deskripsi || null,
    }).returning() as any[];
    const newJabatan = result[0];

    return NextResponse.json(newJabatan, { status: 201 });
  } catch (err: any) {
    console.error("POST jabatan error:", err);
    return NextResponse.json({ error: "Gagal menyimpan jabatan" }, { status: 500 });
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
    return NextResponse.json({ error: "ID jabatan diperlukan" }, { status: 400 });
  }

  try {
    const body = await request.json();
    await db.update(jabatan)
      .set({ nama: body.nama, deskripsi: body.deskripsi || null })
      .where(eq(jabatan.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT jabatan error:", err);
    return NextResponse.json({ error: "Gagal memperbarui jabatan" }, { status: 500 });
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
      return NextResponse.json({ error: "ID jabatan diperlukan" }, { status: 400 });
    }

    const pegawaiCount = await db.select({ c: count() }).from(pegawai).where(eq(pegawai.id_jabatan, id));
    if (pegawaiCount[0]?.c > 0) {
      return NextResponse.json({ error: "Tidak dapat menghapus jabatan yang masih memiliki pegawai" }, { status: 400 });
    }

    await db.delete(jabatan).where(eq(jabatan.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE jabatan error:", err);
    return NextResponse.json({ error: "Gagal menghapus jabatan" }, { status: 500 });
  }
}
