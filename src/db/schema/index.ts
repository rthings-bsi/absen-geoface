import "dotenv/config";
import * as sqliteSchema from "./sqlite";
import * as pgSchema from "./pg";

// Pilih dialect berdasarkan DATABASE_URL:
// - file:...  -> SQLite (lokal)
// - postgres* -> PostgreSQL / Supabase (Vercel production)
const isPostgres = (process.env.DATABASE_URL || "")
  .toLowerCase()
  .startsWith("postgres");

const schema = isPostgres ? pgSchema : sqliteSchema;

// Tables
export const users = schema.users;
export const jabatan = schema.jabatan;
export const jam_kerja = schema.jam_kerja;
export const roles = schema.roles;
export const permissions = schema.permissions;
export const role_permission = schema.role_permission;
export const struktur_organisasi = schema.struktur_organisasi;
export const pegawai = schema.pegawai;
export const absensi = schema.absensi;
export const pengajuan = schema.pengajuan;
export const notifikasi = schema.notifikasi;
export const lokasi_kantor = schema.lokasi_kantor;

// Relations
export const pegawaiRelations = schema.pegawaiRelations;
export const absensiRelations = schema.absensiRelations;
export const pengajuanRelations = schema.pengajuanRelations;
export const notifikasiRelations = schema.notifikasiRelations;
export const struktur_organisasiRelations = schema.struktur_organisasiRelations;
