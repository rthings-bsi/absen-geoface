import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { old_password, new_password } = body;

  // Get user
  const userId = parseInt(session.user.id);
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  // Verify old password
  const isValid = await bcrypt.compare(old_password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
  }

  // Update password
  const hashedPassword = await bcrypt.hash(new_password, 10);
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
