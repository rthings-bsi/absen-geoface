import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { roles, permissions, role_permission } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  const data = await db.query.roles.findMany();
  const rows = await Promise.all(
    data.map(async (role: any) => {
      const rp = await db
        .select({ nama: permissions.nama })
        .from(role_permission)
        .innerJoin(permissions, eq(role_permission.id_permission, permissions.id))
        .where(eq(role_permission.id_role, role.id));
      return {
        ...role,
        permissions: rp.map((p: any) => p.nama),
      };
    })
  );
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.nama) {
      return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
    }

    const roleResult = await db.insert(roles).values({
      nama: body.nama,
      deskripsi: body.deskripsi || null,
      can_admin: body.can_admin || false,
    }).returning() as any[];
    const newRole = roleResult[0];

    if (body.permissions && Array.isArray(body.permissions)) {
      const permRows = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.nama, body.permissions));
      for (const perm of permRows) {
        await db.insert(role_permission).values({
          id_role: newRole.id,
          id_permission: perm.id,
        });
      }
    }

    return NextResponse.json(newRole, { status: 201 });
  } catch (err: any) {
    console.error("POST role error:", err);
    return NextResponse.json({ error: "Gagal menyimpan role" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ error: "ID role diperlukan" }, { status: 400 });
  }

  try {
    const body = await request.json();
    await db.update(roles)
      .set({
        nama: body.nama,
        deskripsi: body.deskripsi,
        can_admin: body.can_admin || false,
      })
      .where(eq(roles.id, id));

    if (body.permissions && Array.isArray(body.permissions)) {
      await db.delete(role_permission).where(eq(role_permission.id_role, id));
      const permRows = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.nama, body.permissions));
      for (const perm of permRows) {
        await db.insert(role_permission).values({
          id_role: id,
          id_permission: perm.id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT role error:", err);
    return NextResponse.json({ error: "Gagal memperbarui role" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) {
      return NextResponse.json({ error: "ID role diperlukan" }, { status: 400 });
    }

    await db.delete(role_permission).where(eq(role_permission.id_role, id));
    await db.delete(roles).where(eq(roles.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE role error:", err);
    return NextResponse.json({ error: "Gagal menghapus role" }, { status: 500 });
  }
}
