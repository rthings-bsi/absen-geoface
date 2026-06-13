import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lokasi_kantor } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const data = await db.query.lokasi_kantor.findFirst();
  if (!data) {
    return NextResponse.json({
      nama: "Pemerintah Kota Karawang",
      alamat: "Karawang, Jawa Barat",
      latitude: "-6.2671",
      longitude: "107.2726",
      radius: 100,
    });
  }
  return NextResponse.json({
    id: data.id,
    nama: data.nama_instansi,
    alamat: data.alamat,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: data.radius,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.nama || !body.alamat || !body.latitude || !body.longitude) {
      return NextResponse.json({ error: "Nama, alamat, latitude, dan longitude wajib diisi" }, { status: 400 });
    }

    const existing = await db.query.lokasi_kantor.findFirst();

    if (existing) {
      await db.update(lokasi_kantor)
        .set({
          nama_instansi: body.nama,
          alamat: body.alamat,
          latitude: body.latitude,
          longitude: body.longitude,
          radius: Number(body.radius) || 100,
        })
        .where(eq(lokasi_kantor.id, existing.id));
    } else {
      await db.insert(lokasi_kantor).values({
        nama_instansi: body.nama,
        alamat: body.alamat,
        latitude: body.latitude,
        longitude: body.longitude,
        radius: Number(body.radius) || 100,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT lokasi-kantor error:", err);
    return NextResponse.json({ error: "Gagal menyimpan lokasi kantor" }, { status: 500 });
  }
}
