import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "foto-profile");

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const fotoUrl = `/uploads/foto-profile/${fileName}`;

    // Update database
    await db.update(pegawai)
      .set({ foto_profile: fotoUrl })
      .where(eq(pegawai.id, session.user.id_pegawai));

    return NextResponse.json({
      success: true,
      foto: fotoUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal mengupload foto" }, { status: 500 });
  }
}
