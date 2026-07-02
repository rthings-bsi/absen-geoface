import { db } from "@/db";
import { notifikasi, pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Notifikasi Service
 * Mengirim notifikasi in-app ke pegawai
 */
export class NotifikasiService {
  /**
   * Kirim notifikasi ke satu pegawai
   */
  static async sendToPegawai(
    id_penerima: number,
    judul: string,
    pesan: string,
    link?: string
  ) {
    await db.insert(notifikasi).values({
      id_penerima,
      judul,
      pesan,
      link: link || null,
    });
  }

  /**
   * Kirim notifikasi ke semua admin
   */
  static async sendToAllAdmin(judul: string, pesan: string, link?: string) {
    const admins = await db.query.pegawai.findMany({
      where: (p: any, { eq }: any) => eq(p.role, "Admin"),
    });

    for (const admin of admins) {
      await this.sendToPegawai(admin.id, judul, pesan, link);
    }
  }

  /**
   * Kirim notifikasi ke semua pegawai
   */
  static async sendToAllPegawai(judul: string, pesan: string, link?: string) {
    const allPegawai = await db.query.pegawai.findMany();

    for (const p of allPegawai) {
      await this.sendToPegawai(p.id, judul, pesan, link);
    }
  }

  /**
   * Kirim notifikasi absensi masuk
   */
  static async notifyAbsensiMasuk(pegawaiId: number, nama: string, status: string) {
    await this.sendToAllAdmin(
      "Absensi Masuk",
      `${nama} melakukan absen masuk (${status})`,
      "/admin/monitoring"
    );
  }

  /**
   * Kirim notifikasi absensi pulang
   */
  static async notifyAbsensiPulang(pegawaiId: number, nama: string, status: string) {
    await this.sendToAllAdmin(
      "Absensi Pulang",
      `${nama} melakukan absen pulang (${status})`,
      "/admin/monitoring"
    );
  }

  /**
   * Kirim notifikasi pengajuan baru
   */
  static async notifyPengajuanBaru(pegawaiId: number, nama: string, jenis: string) {
    await this.sendToAllAdmin(
      `Pengajuan ${jenis} Baru`,
      `${nama} mengajukan ${jenis}`,
      "/admin/pengajuan"
    );
  }

  /**
   * Kirim notifikasi pengajuan disetujui/ditolak
   */
  static async notifyPengajuanStatus(
    pegawaiId: number,
    jenis: string,
    status: "Disetujui" | "Ditolak",
    alasan?: string
  ) {
    const message =
      status === "Disetujui"
        ? `Pengajuan ${jenis} Anda telah disetujui`
        : `Pengajuan ${jenis} Anda ditolak${alasan ? `: ${alasan}` : ""}`;

    await this.sendToPegawai(pegawaiId, `Pengajuan ${status}`, message, "/pegawai/pengajuan");
  }

  /**
   * Mark semua notifikasi sebagai dibaca
   */
  static async markAllAsRead(id_penerima: number) {
    await db
      .update(notifikasi)
      .set({ is_dibaca: true })
      .where(eq(notifikasi.id_penerima, id_penerima));
  }
}
