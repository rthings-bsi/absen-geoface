import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pengajuan, pegawai, notifikasi } from "@/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const approver = alias(pegawai, "approver");

// GET: Detail pengajuan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id_pegawai) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
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
      approver_nip: approver.nip,
      approver_nama: approver.nama,
    })
    .from(pengajuan)
    .leftJoin(pegawai, eq(pengajuan.id_pegawai, pegawai.id))
    .leftJoin(approver, eq(pengajuan.id_approved_by, approver.id))
    .where(eq(pengajuan.id, parseInt(id)));

  if (!row) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }

  // Check access
  if (!session.user.can_admin && row.id_pegawai !== session.user.id_pegawai) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = {
    ...row,
    pegawai: { nip: row.pegawai_nip, nama: row.pegawai_nama },
    approver: row.approver_nip
      ? { nip: row.approver_nip, nama: row.approver_nama }
      : null,
  };
  // Clean flat aliases
  delete (data as any).pegawai_nip;
  delete (data as any).pegawai_nama;
  delete (data as any).approver_nip;
  delete (data as any).approver_nama;

  return NextResponse.json(data);
}

// PUT: Approve/reject pengajuan
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, alasan_penolakan } = body; // action: "approve" | "reject"

  const pengajuanData = await db.query.pengajuan.findFirst({
    where: eq(pengajuan.id, parseInt(id)),
  });

  if (!pengajuanData) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }

  if (pengajuanData.status !== "Pending") {
    return NextResponse.json({ error: "Pengajuan sudah diproses" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "Disetujui" : "Ditolak";

  await db.update(pengajuan)
    .set({
      status: newStatus,
      id_approved_by: session.user.id_pegawai,
      alasan_penolakan: action === "reject" ? alasan_penolakan : null,
    })
    .where(eq(pengajuan.id, parseInt(id)));

  // Notify the pegawai
  try {
    await db.insert(notifikasi).values({
      id_penerima: pengajuanData.id_pegawai,
      id_pengirim: session.user.id_pegawai,
      judul: `Pengajuan ${newStatus}`,
      pesan: `Pengajuan ${pengajuanData.jenis} Anda ${newStatus.toLowerCase()}${action === "reject" ? `: ${alasan_penolakan}` : ""}`,
      link: "/pegawai/pengajuan",
    });
  } catch (err) {
    console.error("Notification error:", err);
  }

  return NextResponse.json({ success: true, status: newStatus });
}
