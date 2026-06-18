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
  const nowWib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const nowMinutes = nowWib.getHours() * 60 + nowWib.getMinutes();

  // Check if already clocked in today
  const existing = await db.query.absensi.findFirst({
    where: and(
      eq(absensi.id_pegawai, id_pegawai),
      eq(absensi.tanggal, today)
    ),
  });

  if (existing?.jam_masuk) {
    return NextResponse.json({ error: "Anda sudah melakukan absen masuk hari ini" }, { status: 400 });
  }

  // Get pegawai data for rate limiting
  const pegawaiData = await db.query.pegawai.findFirst({
    where: eq(pegawai.id, id_pegawai),
  });

  if (!pegawaiData) {
    return NextResponse.json({ error: "Data pegawai tidak ditemukan" }, { status: 404 });
  }

  // Check rate limiting
  if (pegawaiData.last_absen_attempt) {
    const lastAttempt = new Date(pegawaiData.last_absen_attempt);
    const diffMs = now.getTime() - lastAttempt.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    // Minimum 5 seconds between attempts — diturunkan dari 15s
    if (diffSec < 15) {
      return NextResponse.json({ error: "Tunggu 5 detik antar percobaan" }, { status: 429 });
    }

    // Cooldown 5 minutes after 5 failed attempts
    if (pegawaiData.failed_attempts >= 5 && diffSec < 300) {
      const remaining = Math.ceil((300 - diffSec) / 60);
      return NextResponse.json({
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${remaining} menit`,
      }, { status: 429 });
    }
  }

  const body = await request.json();
  const { latitude, longitude, confidence, foto, face_descriptor } = body;

  // --- Face Verification ---
  let is_face_verified = false;
  let face_verify_error: string | null = null;

  if (pegawaiData.face_data && Array.isArray(face_descriptor) && face_descriptor.length === 128) {
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

  // If face verification fails, reject
  if (!is_face_verified) {
    // Increment failed attempts
    await db.update(pegawai)
      .set({
        failed_attempts: sql`COALESCE(failed_attempts, 0) + 1`,
        last_absen_attempt: sql`(now() at time zone 'Asia/Jakarta')`,
      })
      .where(eq(pegawai.id, id_pegawai));

    return NextResponse.json({
      error: face_verify_error || "Wajah tidak cocok dengan data terdaftar",
    }, { status: 403 });
  }

  // Determine status (Hadir or Terlambat)
  let status_masuk: "Hadir" | "Terlambat" = "Hadir";

  if (pegawaiData.id_jam_kerja) {
    const jk = await db.query.jam_kerja.findFirst({
      where: eq(jam_kerja.id, pegawaiData.id_jam_kerja),
    });
    if (jk) {
      const [jamH, jamM] = jk.jam_masuk.split(":").map(Number);
      const jamToleransi = jamH * 60 + jamM + jk.toleransi_terlambat;
      if (nowMinutes > jamToleransi) {
        status_masuk = "Terlambat";
      }
    }
  }

  // Get IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

  // Create absensi record
  const absensiResult = await db.insert(absensi).values({
    id_pegawai,
    tanggal: today,
    jam_masuk: timeStr,
    status_masuk,
    foto_masuk: foto || null,
    confidence_masuk: confidence || null,
    verification_method: "face",
    ip_address: ip,
    lokasi_masuk: latitude && longitude ? JSON.stringify({ lat: latitude, lng: longitude }) : null,
    is_face_verified: is_face_verified,
  }).returning() as any[];
  const newAbsensi = absensiResult[0];

  // Reset failed attempts
  await db.update(pegawai)
    .set({ failed_attempts: 0, last_absen_attempt: sql`(now() at time zone 'Asia/Jakarta')` })
    .where(eq(pegawai.id, id_pegawai));

  // Send notification to all admins
  try {
    const adminPegawai = await db.query.pegawai.findMany({
      where: eq(pegawai.role, "Admin"),
    });
    for (const admin of adminPegawai) {
      await db.insert(notifikasi).values({
        id_penerima: admin.id,
        id_pengirim: id_pegawai,
        judul: "Absensi Masuk",
        pesan: `${session.user.nama} melakukan absen masuk (${status_masuk})`,
        link: "/admin/monitoring",
      });
    }
  } catch (err) {
    console.error("Failed to send notification:", err);
  }

  return NextResponse.json({
    success: true,
    absensi: newAbsensi,
    status_masuk,
  });
}
