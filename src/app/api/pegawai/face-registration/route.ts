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
    accessKeyId: "943935eb73ee7edb27274970449d8652a75fb9f5220e647f0833126ba1d9bfa1",
    secretAccessKey: "b8d34ffef747960e80b7e46745ea3ad8",
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