import { pgTable, serial, integer, text, doublePrecision, boolean, index } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// Users table (Auth.js)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: text("created_at").notNull().default(sql`(now() at time zone 'Asia/Jakarta')`),
  updated_at: text("updated_at").notNull().default(sql`(now() at time zone 'Asia/Jakarta')`),
});

// Jabatan
export const jabatan = pgTable("jabatan", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  id_parent: integer("id_parent"),
  deskripsi: text("deskripsi"),
});

// Jam Kerja
export const jam_kerja = pgTable("jam_kerja", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  jam_masuk: text("jam_masuk").notNull(),
  jam_pulang: text("jam_pulang").notNull(),
  toleransi_terlambat: integer("toleransi_terlambat").notNull().default(30),
  hari_kerja: text("hari_kerja").notNull().default("senin-jumat"),
  aktif: boolean("aktif").notNull().default(true),
  keterangan: text("keterangan"),
});

// Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull().unique(),
  deskripsi: text("deskripsi"),
  can_admin: boolean("can_admin").notNull().default(false),
});

// Permissions
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull().unique(),
  grup: text("grup").notNull(),
  deskripsi: text("deskripsi"),
});

// Role-Permission pivot
export const role_permission = pgTable("role_permission", {
  id_role: integer("id_role").notNull().references(() => roles.id, { onDelete: "cascade" }),
  id_permission: integer("id_permission").notNull().references(() => permissions.id, { onDelete: "cascade" }),
});

// Struktur Organisasi
export const struktur_organisasi = pgTable("struktur_organisasi", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  id_parent: integer("id_parent"),
  id_pegawai_kepala: integer("id_pegawai_kepala"),
  level: integer("level").notNull().default(0),
  urutan: integer("urutan").notNull().default(0),
});

// Pegawai
export const pegawai = pgTable("pegawai", {
  id: serial("id").primaryKey(),
  id_user: integer("id_user").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  nip: text("nip").notNull().unique(),
  nama: text("nama").notNull(),
  tempat_lahir: text("tempat_lahir"),
  tanggal_lahir: text("tanggal_lahir"),
  jenis_kelamin: text("jenis_kelamin", { enum: ["L", "P"] }),
  no_hp: text("no_hp"),
  alamat: text("alamat"),
  id_jabatan: integer("id_jabatan").references(() => jabatan.id, { onDelete: "set null" }),
  id_jam_kerja: integer("id_jam_kerja").references(() => jam_kerja.id, { onDelete: "set null" }),
  id_role: integer("id_role").references(() => roles.id, { onDelete: "set null" }),
  id_struktur: integer("id_struktur").references(() => struktur_organisasi.id, { onDelete: "set null" }),
  face_data: text("face_data"),
  face_registered: boolean("face_registered").notNull().default(false),
  foto_profile: text("foto_profile"),
  last_absen_attempt: text("last_absen_attempt"),
  failed_attempts: integer("failed_attempts").notNull().default(0),
  role: text("role", { enum: ["Admin", "Pegawai"] }).notNull().default("Pegawai"),
}, (table) => ({
  pegawaiRoleIdx: index("idx_pegawai_role").on(table.role),
  pegawaiJabatanIdx: index("idx_pegawai_id_jabatan").on(table.id_jabatan),
}))

// Absensi
export const absensi = pgTable("absensi", {
  id: serial("id").primaryKey(),
  id_pegawai: integer("id_pegawai").notNull().references(() => pegawai.id, { onDelete: "cascade" }),
  tanggal: text("tanggal").notNull(),
  jam_masuk: text("jam_masuk"),
  jam_pulang: text("jam_pulang"),
  status_masuk: text("status_masuk", { enum: ["Hadir", "Terlambat"] }),
  status_pulang: text("status_pulang", { enum: ["Hadir", "CepatPulang"] }),
  foto_masuk: text("foto_masuk"),
  foto_pulang: text("foto_pulang"),
  confidence_masuk: doublePrecision("confidence_masuk"),
  confidence_pulang: doublePrecision("confidence_pulang"),
  verification_method: text("verification_method").default("face"),
  ip_address: text("ip_address"),
  lokasi_masuk: text("lokasi_masuk"),
  lokasi_pulang: text("lokasi_pulang"),
  is_face_verified: boolean("is_face_verified").notNull().default(false),
}, (table) => ({
  absensiTanggalIdx: index("idx_absensi_tanggal").on(table.tanggal),
  absensiPegawaiIdx: index("idx_absensi_id_pegawai").on(table.id_pegawai),
  absensiTanggalPegawaiIdx: index("idx_absensi_tgl_pegawai").on(table.tanggal, table.id_pegawai),
}))

// Pengajuan
export const pengajuan = pgTable("pengajuan", {
  id: serial("id").primaryKey(),
  id_pegawai: integer("id_pegawai").notNull().references(() => pegawai.id, { onDelete: "cascade" }),
  jenis: text("jenis", { enum: ["Cuti", "Izin", "Sakit", "DinasLuar", "Lembur"] }).notNull(),
  tanggal_mulai: text("tanggal_mulai").notNull(),
  tanggal_selesai: text("tanggal_selesai").notNull(),
  alasan: text("alasan").notNull(),
  file_pendukung: text("file_pendukung"),
  status: text("status", { enum: ["Pending", "Disetujui", "Ditolak"] }).notNull().default("Pending"),
  id_approved_by: integer("id_approved_by").references(() => pegawai.id, { onDelete: "set null" }),
  alasan_penolakan: text("alasan_penolakan"),
  created_at: text("created_at").notNull().default(sql`(now() at time zone 'Asia/Jakarta')`),
  updated_at: text("updated_at").notNull().default(sql`(now() at time zone 'Asia/Jakarta')`),
}, (table) => ({
  pengajuanPegawaiIdx: index("idx_pengajuan_id_pegawai").on(table.id_pegawai),
  pengajuanStatusIdx: index("idx_pengajuan_status").on(table.status),
}))

// Notifikasi
export const notifikasi = pgTable("notifikasi", {
  id: serial("id").primaryKey(),
  id_penerima: integer("id_penerima").notNull().references(() => pegawai.id, { onDelete: "cascade" }),
  id_pengirim: integer("id_pengirim").references(() => pegawai.id, { onDelete: "set null" }),
  judul: text("judul").notNull(),
  pesan: text("pesan").notNull(),
  link: text("link"),
  is_dibaca: boolean("is_dibaca").notNull().default(false),
  created_at: text("created_at").notNull().default(sql`(now() at time zone 'Asia/Jakarta')`),
}, (table) => ({
  notifPenerimaIdx: index("idx_notifikasi_id_penerima").on(table.id_penerima),
  notifDibacaIdx: index("idx_notifikasi_is_dibaca").on(table.is_dibaca),
}))

// Lokasi Kantor (single record)
export const lokasi_kantor = pgTable("lokasi_kantor", {
  id: serial("id").primaryKey(),
  nama_instansi: text("nama_instansi").notNull().default("Pemerintah Kota Karawang"),
  alamat: text("alamat").notNull().default("Karawang, Jawa Barat"),
  latitude: text("latitude").notNull().default("-6.2671"),
  longitude: text("longitude").notNull().default("107.2726"),
  radius: integer("radius").notNull().default(100),
});

// Relations (required for Drizzle `with` queries)
export const pegawaiRelations = relations(pegawai, ({ one, many }) => ({
  jabatan: one(jabatan, { fields: [pegawai.id_jabatan], references: [jabatan.id] }),
  jam_kerja: one(jam_kerja, { fields: [pegawai.id_jam_kerja], references: [jam_kerja.id] }),
  absensi: many(absensi),
  pengajuan: many(pengajuan),
}));

export const absensiRelations = relations(absensi, ({ one }) => ({
  pegawai: one(pegawai, { fields: [absensi.id_pegawai], references: [pegawai.id] }),
}));

export const pengajuanRelations = relations(pengajuan, ({ one }) => ({
  pegawai: one(pegawai, { fields: [pengajuan.id_pegawai], references: [pegawai.id] }),
  approver: one(pegawai, { fields: [pengajuan.id_approved_by], references: [pegawai.id] }),
}));

export const notifikasiRelations = relations(notifikasi, ({ one }) => ({
  penerima: one(pegawai, { fields: [notifikasi.id_penerima], references: [pegawai.id] }),
  pengirim: one(pegawai, { fields: [notifikasi.id_pengirim], references: [pegawai.id] }),
}));

export const struktur_organisasiRelations = relations(struktur_organisasi, ({ one }) => ({
  pegawai_kepala: one(pegawai, { fields: [struktur_organisasi.id_pegawai_kepala], references: [pegawai.id] }),
}));
