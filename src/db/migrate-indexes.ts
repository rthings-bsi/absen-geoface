import { db } from "./index";

const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal)",
  "CREATE INDEX IF NOT EXISTS idx_absensi_id_pegawai ON absensi(id_pegawai)",
  "CREATE INDEX IF NOT EXISTS idx_absensi_tgl_pegawai ON absensi(tanggal, id_pegawai)",
  "CREATE INDEX IF NOT EXISTS idx_pegawai_role ON pegawai(role)",
  "CREATE INDEX IF NOT EXISTS idx_pegawai_id_jabatan ON pegawai(id_jabatan)",
  "CREATE INDEX IF NOT EXISTS idx_pengajuan_id_pegawai ON pengajuan(id_pegawai)",
  "CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan(status)",
  "CREATE INDEX IF NOT EXISTS idx_notifikasi_id_penerima ON notifikasi(id_penerima)",
  "CREATE INDEX IF NOT EXISTS idx_notifikasi_is_dibaca ON notifikasi(is_dibaca)",
];

try {
  for (const sql of indexes) {
    db.run(sql);
    console.log(`✓ ${sql.split("ON ")[1] || sql}`);
  }
  console.log("All indexes created successfully.");
} catch (err) {
  console.error("Failed to create indexes:", err);
  process.exit(1);
}
