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
    accessKeyId: "943935eb73ee7edb27274970449d8652a75fb9f5220e647f0833126ba1d9bfa1",
    secretAccessKey: "b8d34ffef747960e80b7e46745ea3ad8",
  },
  forcePathStyle: true, // S3-compatible storage membutuhkan ini
});

// POST: Upload foto profile
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("foto") as File | null;

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
    const fileName = `foto-${session.user.id_pegawai}-${Date.now()}.${ext}`;
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
      .where(eq(pegawai.id, session.user.id_pegawai));

    return NextResponse.json({
      success: true,
      foto: publicUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal mengupload foto" }, { status: 500 });
  }
}
