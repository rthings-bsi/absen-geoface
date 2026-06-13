import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pengajuan, pegawai, notifikasi } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

// GET: List pengajuan
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id_pegawai) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let status = searchParams.get("status");
    if (status && status !== "Semua") {
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    let whereClause = undefined;
    if (session.user.can_admin) {
      if (status && status !== "Semua") {
        whereClause = eq(pengajuan.status, status as "Pending" | "Disetujui" | "Ditolak");
      }
    } else {
      const conditions = [eq(pengajuan.id_pegawai, session.user.id_pegawai)];
      if (status && status !== "Semua") {
        conditions.push(eq(pengajuan.status, status as "Pending" | "Disetujui" | "Ditolak"));
      }
      whereClause = and(...conditions);
    }

    const rows = await db
      .select({
        id: pengajuan.id,
        id_pegawai: pengajuan.id_pegawai,
        jenis: pengajuan.jenis,
        tanggal_mulai: pengajuan.tanggal_mulai,
        tanggal_selesai: pengajuan.tanggal_selesai,
        alasan: pengajuan.alasan,
        file_pendukung: pengajuan.file_pendukung,
        status: pengajuan.status,
        id_approved_by: pengajuan.id_approved_by,
        alasan_penolakan: pengajuan.alasan_penolakan,
        created_at: pengajuan.created_at,
        updated_at: pengajuan.updated_at,
        pegawai_nip: pegawai.nip,
        pegawai_nama: pegawai.nama,
      })
      .from(pengajuan)
      .leftJoin(pegawai, eq(pengajuan.id_pegawai, pegawai.id))
      .where(whereClause)
      .orderBy(desc(pengajuan.created_at));

    const data = rows.map(({ pegawai_nip, pegawai_nama, ...rest }) => ({
      ...rest,
      pegawai: {
        nip: pegawai_nip,
        nama: pegawai_nama,
      },
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET pengajuan error:", err);
    return NextResponse.json({ error: "Gagal memuat data pengajuan" }, { status: 500 });
  }
}

// POST: Create pengajuan
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  let jenis = (formData.get("jenis") as string) || "";
  const tanggal_mulai = formData.get("tanggal_mulai") as string;
  const tanggal_selesai = formData.get("tanggal_selesai") as string;
  const alasan = formData.get("alasan") as string;

  // Normalize jenis to match DB enum format (capitalized)
  if (jenis) jenis = jenis.charAt(0).toUpperCase() + jenis.slice(1).toLowerCase();

  if (!jenis || !tanggal_mulai || !alasan) {
    return NextResponse.json({ error: "Jenis, tanggal mulai, dan alasan harus diisi" }, { status: 400 });
  }

  if (alasan.length < 10) {
    return NextResponse.json({ error: "Alasan minimal 10 karakter" }, { status: 400 });
  }

  // Handle file upload (pegawai form sends "lampiran" or "file")
  let file_pendukung = null;
  const file = (formData.get("file") || formData.get("lampiran")) as File | null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `public/uploads/struktur/${fileName}`;
    const { writeFile } = await import("fs/promises");
    await writeFile(filePath, buffer);
    file_pendukung = `/uploads/struktur/${fileName}`;
  }

  try {
    const pengajuanResult = await db.insert(pengajuan).values({
      id_pegawai: session.user.id_pegawai,
      jenis: jenis as any,
      tanggal_mulai,
      tanggal_selesai: tanggal_selesai || tanggal_mulai,
      alasan,
      file_pendukung,
      status: "Pending",
    }).returning() as any[];
    const newPengajuan = pengajuanResult?.[0] || null;

    // Notify all admins
    try {
      const adminPegawai = await db
        .select({ id: pegawai.id, nama: pegawai.nama })
        .from(pegawai)
        .where(eq(pegawai.role, "Admin"));
      for (const admin of adminPegawai) {
        await db.insert(notifikasi).values({
          id_penerima: admin.id,
          id_pengirim: session.user.id_pegawai,
          judul: `Pengajuan ${jenis} Baru`,
          pesan: `${session.user.nama} mengajukan ${jenis}`,
          link: "/admin/pengajuan",
        });
      }
    } catch (err) {
      console.error("Notification error:", err);
    }

    return NextResponse.json(newPengajuan, { status: 201 });
  } catch (err) {
    console.error("Insert pengajuan error:", err);
    return NextResponse.json({ error: "Gagal menyimpan pengajuan" }, { status: 500 });
  }
}
