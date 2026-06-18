import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pegawai, jabatan, users } from "@/db/schema";
import { eq, like, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET: List pegawai with filters
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let whereClause = undefined;
  if (search) {
    whereClause = or(
      like(pegawai.nama, `%${search}%`),
      like(pegawai.nip, `%${search}%`)
    );
  }

  const rows = await db
    .select({
      id: pegawai.id,
      id_user: pegawai.id_user,
      nip: pegawai.nip,
      nama: pegawai.nama,
      email: users.email,
      no_hp: pegawai.no_hp,
      alamat: pegawai.alamat,
      id_jabatan: pegawai.id_jabatan,
      role: pegawai.role,
      is_active: users.is_active,
      jabatan_nama: jabatan.nama,
      foto_profile: pegawai.foto_profile,
    })
    .from(pegawai)
    .leftJoin(jabatan, eq(pegawai.id_jabatan, jabatan.id))
    .leftJoin(users, eq(pegawai.id_user, users.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  const data = rows.map(({ jabatan_nama, is_active, no_hp, id_jabatan, ...rest }) => ({
    ...rest,
    id_jabatan,
    jabatan_id: id_jabatan,
    telepon: no_hp,
    no_hp,
    status: is_active ? "aktif" : "nonaktif",
    jabatan: jabatan_nama ? { id: id_jabatan, nama: jabatan_nama } : null,
  }));

  return NextResponse.json(data);
}

// POST: Create pegawai
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }
  if (!body.nip) {
    return NextResponse.json({ error: "NIP wajib diisi" }, { status: 400 });
  }
  if (!body.nama) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }

  try {
    const hashedPassword = await bcrypt.hash(body.password || "password", 10);
    const userResult = await db.insert(users).values({
      email: body.email,
      password: hashedPassword,
      is_active: body.status !== "nonaktif",
    }).returning() as any[];
    const newUser = userResult[0];

    const pegawaiResult = await db.insert(pegawai).values({
      id_user: newUser.id,
      nip: body.nip,
      nama: body.nama,
      no_hp: body.no_hp || null,
      alamat: body.alamat || null,
      id_jabatan: body.id_jabatan || null,
      role: "Pegawai",
    }).returning() as any[];
    const newPegawai = pegawaiResult[0];

    return NextResponse.json(newPegawai, { status: 201 });
  } catch (err: any) {
    const msg = err?.message || "";
    const causeMsg = err?.cause?.message || "";
    const isUniqueError = msg.includes("UNIQUE") || causeMsg.includes("duplicate key");

    if (isUniqueError && (msg.includes("nip") || causeMsg.includes("nip"))) {
      return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 409 });
    }
    if (isUniqueError && (msg.includes("email") || causeMsg.includes("email") || msg.includes("users.email") || causeMsg.includes("users.email"))) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    console.error("POST pegawai error:", err);
    return NextResponse.json({ error: "Gagal menyimpan pegawai" }, { status: 500 });
  }
}

// PUT: Update pegawai
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID pegawai diperlukan" }, { status: 400 });
  }

  try {
    await db.update(pegawai)
      .set({
        nip: data.nip,
        nama: data.nama,
        no_hp: data.no_hp,
        alamat: data.alamat,
        id_jabatan: data.id_jabatan,
      })
      .where(eq(pegawai.id, id));

    const p = await db.query.pegawai.findFirst({ where: eq(pegawai.id, id) });
    if (p) {
      const userUpdate: Record<string, unknown> = {};
      if (data.email) {
        const currentUser = await db.query.users.findFirst({ where: eq(users.id, p.id_user) });
        if (currentUser && currentUser.email !== data.email) {
          userUpdate.email = data.email;
        }
      }
      if (data.password) userUpdate.password = await bcrypt.hash(data.password, 10);
      if (data.status) userUpdate.is_active = data.status !== "nonaktif";
      if (Object.keys(userUpdate).length > 0) {
        await db.update(users).set(userUpdate).where(eq(users.id, p.id_user));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err?.message || "";
    const causeMsg = err?.cause?.message || "";
    const isUniqueError = msg.includes("UNIQUE") || causeMsg.includes("duplicate key");

    if (isUniqueError && (msg.includes("nip") || causeMsg.includes("nip"))) {
      return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 409 });
    }
    if (isUniqueError && (msg.includes("email") || causeMsg.includes("email") || msg.includes("users.email") || causeMsg.includes("users.email"))) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    console.error("PUT pegawai error:", err);
    return NextResponse.json({ error: "Gagal memperbarui pegawai" }, { status: 500 });
  }
}

// DELETE: Delete pegawai
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "");

  // Get pegawai to find id_user
  const p = await db.query.pegawai.findFirst({ where: eq(pegawai.id, id) });
  if (!p) {
    return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
  }

  await db.delete(pegawai).where(eq(pegawai.id, id));
  await db.delete(users).where(eq(users.id, p.id_user));

  return NextResponse.json({ success: true });
}
