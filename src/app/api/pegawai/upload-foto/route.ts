import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Inisialisasi S3 client untuk Supabase Storage (S3-compatible)
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://xzsjurveiasdvteuvdgb.storage.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: "458893ba123f49f069de37067917bf0a",
    secretAccessKey: "f2095b2176a080a3e53c93fe806a37a7622299f54736462d7832b1ad9f62df56",
  },
  forcePathStyle: true, // S3-compatible storage membutuhkan ini
});

// POST: Upload foto profile
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai && !session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("foto") as File | null;
    const targetIdStr = formData.get("id_pegawai") as string | null;

    let targetId = session.user.id_pegawai;
    if (targetIdStr && session.user.can_admin) {
      targetId = parseInt(targetIdStr);
    }

    if (!targetId) {
      return NextResponse.json({ error: "ID Pegawai tidak ditemukan" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file harus JPG, PNG, atau WebP" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `foto-${targetId}-${Date.now()}.${ext}`;
    const key = `foto-profile/${fileName}`;

    // Upload ke Supabase Storage via S3 API
    await s3.send(new PutObjectCommand({
      Bucket: "uploads",
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // URL public
    const publicUrl = `https://xzsjurveiasdvteuvdgb.storage.supabase.co/storage/v1/object/public/uploads/${key}`;

    // Update database
    await db.update(pegawai)
      .set({ foto_profile: publicUrl })
      .where(eq(pegawai.id, targetId));

    return NextResponse.json({
      success: true,
      foto: publicUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal mengupload foto" }, { status: 500 });
  }
}
