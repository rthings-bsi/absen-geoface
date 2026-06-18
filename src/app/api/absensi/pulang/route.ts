import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai, jam_kerja, notifikasi } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifyFaceMatch, FACE_THRESHOLDS } from "@/lib/face";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id_pegawai = session.user.id_pegawai;

  // Gunakan timezone Asia/Jakarta (WIB)
  const now = new Date();
  const today = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString("sv-SE", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });
  const [hh, mm] = timeStr.split(":").map(Number);
  const nowMinutes = hh * 60 + mm;

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
  const { latitude, longitude, confidence, foto, face_descriptor } = body;

  // --- Face Verification ---
  let is_face_verified = false;
  let face_verify_error: string | null = null;

  const pegawaiData = await db.query.pegawai.findFirst({
    where: eq(pegawai.id, id_pegawai),
  });

  if (pegawaiData?.face_data && Array.isArray(face_descriptor) && face_descriptor.length === 128) {
    try {
      const storedDescriptor: number[] = JSON.parse(pegawaiData.face_data);
      if (Array.isArray(storedDescriptor) && storedDescriptor.length === 128) {
        is_face_verified = verifyFaceMatch(face_descriptor, storedDescriptor, FACE_THRESHOLDS.VERIFICATION);
      } else {
        face_verify_error = "Data wajah tersimpan tidak valid";
      }
    } catch {
      face_verify_error = "Gagal memproses data wajah";
    }
  } else {
    face_verify_error = "Data wajah tidak lengkap";
  }

  if (!is_face_verified) {
    return NextResponse.json({
      error: face_verify_error || "Wajah tidak cocok dengan data terdaftar",
    }, { status: 403 });
  }

  // Determine status (Pulang or CepatPulang)
  let status_pulang: "Hadir" | "CepatPulang" = "Hadir";
  if (session.user.id_role && pegawaiData) {
    if (pegawaiData.id_jam_kerja) {
      const jk = await db.query.jam_kerja.findFirst({
        where: eq(jam_kerja.id, pegawaiData.id_jam_kerja),
      });
      if (jk) {
        const [pulangH, pulangM] = jk.jam_pulang.split(":").map(Number);
        const pulangMinutes = pulangH * 60 + pulangM;
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
