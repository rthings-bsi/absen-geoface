import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://xzsjurveiasdvteuvdgb.storage.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: "458893ba123f49f069de37067917bf0a",
    secretAccessKey: "f2095b2176a080a3e53c93fe806a37a7622299f54736462d7832b1ad9f62df56",
  },
  forcePathStyle: true,
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = await db.query.pegawai.findFirst({
    where: eq(pegawai.id, session.user.id_pegawai),
  });

  return NextResponse.json({
    registered: p?.face_registered ?? false,
    has_face_data: !!p?.face_data,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { face_data } = body;

  if (!face_data || !Array.isArray(face_data)) {
    return NextResponse.json({ error: "Data wajah tidak valid" }, { status: 400 });
  }

  await db.update(pegawai)
    .set({
      face_data: JSON.stringify(face_data),
      face_registered: true,
    })
    .where(eq(pegawai.id, session.user.id_pegawai));

  return NextResponse.json({ success: true, registered: true });
}