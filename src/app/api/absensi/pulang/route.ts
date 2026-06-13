import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai, jam_kerja, notifikasi } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id_pegawai = session.user.id_pegawai;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Find today's absensi
  const existing = await db.query.absensi.findFirst({
    where: and(
      eq(absensi.id_pegawai, id_pegawai),
      eq(absensi.tanggal, today)
    ),
  });

  if (!existing) {
    return NextResponse.json({ error: "Anda belum melakukan absen masuk hari ini" }, { status: 400 });
  }

  if (existing.jam_pulang) {
    return NextResponse.json({ error: "Anda sudah melakukan absen pulang hari ini" }, { status: 400 });
  }

  const body = await request.json();
  const { latitude, longitude, confidence, foto } = body;

  // Determine status (Pulang or CepatPulang)
  let status_pulang: "Hadir" | "CepatPulang" = "Hadir";
  if (session.user.id_role) {
    const pegawaiData = await db.query.pegawai.findFirst({
      where: eq(pegawai.id, id_pegawai),
    });
    if (pegawaiData?.id_jam_kerja) {
      const jk = await db.query.jam_kerja.findFirst({
        where: eq(jam_kerja.id, pegawaiData.id_jam_kerja),
      });
      if (jk) {
        const [pulangH, pulangM] = jk.jam_pulang.split(":").map(Number);
        const pulangMinutes = pulangH * 60 + pulangM;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (nowMinutes < pulangMinutes - 30) {
          status_pulang = "CepatPulang";
        }
      }
    }
  }

  // Update absensi
  await db.update(absensi)
    .set({
      jam_pulang: timeStr,
      status_pulang,
      foto_pulang: foto || null,
      confidence_pulang: confidence || null,
      lokasi_pulang: latitude && longitude ? JSON.stringify({ lat: latitude, lng: longitude }) : null,
    })
    .where(eq(absensi.id, existing.id));

  // Send notification
  try {
    const adminPegawai = await db.query.pegawai.findMany({
      where: eq(pegawai.role, "Admin"),
    });
    for (const admin of adminPegawai) {
      await db.insert(notifikasi).values({
        id_penerima: admin.id,
        id_pengirim: id_pegawai,
        judul: "Absensi Pulang",
        pesan: `${session.user.nama} melakukan absen pulang (${status_pulang})`,
        link: "/admin/monitoring",
      });
    }
  } catch (err) {
    console.error("Failed to send notification:", err);
  }

  return NextResponse.json({
    success: true,
    status_pulang,
  });
}
