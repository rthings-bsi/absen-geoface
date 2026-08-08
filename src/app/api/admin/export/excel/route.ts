import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai, jabatan } from "@/db/schema";
import { eq, like, and } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periode = searchParams.get("periode") || "hari";

  let dateFilter;
  let filenameDate = "";

  if (periode === "bulan") {
    const bulan = searchParams.get("bulan");
    if (bulan) {
      dateFilter = like(absensi.tanggal, bulan + "-%");
      filenameDate = bulan;
    } else {
      const now = new Date();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const ym = `${now.getFullYear()}-${m}`;
      dateFilter = like(absensi.tanggal, `${ym}-%`);
      filenameDate = ym;
    }
  } else if (periode === "tahun") {
    const tahun = searchParams.get("tahun");
    if (tahun) {
      dateFilter = like(absensi.tanggal, tahun + "-%");
      filenameDate = tahun;
    } else {
      const y = `${new Date().getFullYear()}`;
      dateFilter = like(absensi.tanggal, `${y}-%`);
      filenameDate = y;
    }
  } else {
    const date = searchParams.get("tanggal") || searchParams.get("date") || new Date().toISOString().split("T")[0];
    dateFilter = eq(absensi.tanggal, date);
    filenameDate = date;
  }

  const data = await db
    .select({
      id: absensi.id,
      tanggal: absensi.tanggal,
      jam_masuk: absensi.jam_masuk,
      jam_pulang: absensi.jam_pulang,
      status_masuk: absensi.status_masuk,
      is_face_verified: absensi.is_face_verified,
      berita_acara: absensi.berita_acara,
      pegawai_nip: pegawai.nip,
      pegawai_nama: pegawai.nama,
      jabatan_nama: jabatan.nama,
    })
    .from(absensi)
    .leftJoin(pegawai, eq(absensi.id_pegawai, pegawai.id))
    .leftJoin(jabatan, eq(pegawai.id_jabatan, jabatan.id))
    .where(and(dateFilter));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Absensi");
  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Tanggal", key: "tanggal", width: 15 },
    { header: "NIP", key: "nip", width: 20 },
    { header: "Nama", key: "nama", width: 25 },
    { header: "Jabatan", key: "jabatan", width: 20 },
    { header: "Jam Masuk", key: "jam_masuk", width: 12 },
    { header: "Jam Pulang", key: "jam_pulang", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Verifikasi", key: "verifikasi", width: 15 },
    { header: "Berita Acara", key: "berita_acara", width: 40 },
  ];

  data.forEach((row: { tanggal?: string; jam_masuk?: string; jam_pulang?: string; pegawai_nip?: string; pegawai_nama?: string; jabatan_nama?: string; status_masuk?: string; is_face_verified?: boolean | null; berita_acara?: string | null }, i: number) => {
    sheet.addRow({
      no: i + 1,
      tanggal: row.tanggal || "-",
      nip: row.pegawai_nip || "-",
      nama: row.pegawai_nama || "-",
      jabatan: row.jabatan_nama || "-",
      jam_masuk: row.jam_masuk?.slice(0, 5) || "-",
      jam_pulang: row.jam_pulang?.slice(0, 5) || "-",
      status: row.status_masuk || "Alpa",
      verifikasi: row.is_face_verified ? "Wajah" : "-",
      berita_acara: row.berita_acara || "-",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-absensi-${filenameDate}.xlsx"`,
    },
  });
}
