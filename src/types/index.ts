export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pegawai {
  id: number;
  id_user: number;
  nip: string;
  nama: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: "L" | "P" | null;
  no_hp: string | null;
  alamat: string | null;
  id_jabatan: number | null;
  id_jam_kerja: number | null;
  id_role: number | null;
  id_struktur: number | null;
  face_data: string | null;
  face_registered: boolean;
  foto_profile: string | null;
  last_absen_attempt: string | null;
  failed_attempts: number;
  role: "Admin" | "Pegawai";
  jabatan?: Jabatan;
  jam_kerja?: JamKerja;
  role_data?: Role;
}

export interface Jabatan {
  id: number;
  nama: string;
  id_parent: number | null;
  deskripsi: string | null;
  children?: Jabatan[];
}

export interface JamKerja {
  id: number;
  nama: string;
  jam_masuk: string;
  jam_pulang: string;
  toleransi_terlambat: number;
}

export interface Absensi {
  id: number;
  id_pegawai: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status_masuk: "Hadir" | "Terlambat" | null;
  status_pulang: "Hadir" | "CepatPulang" | null;
  foto_masuk: string | null;
  foto_pulang: string | null;
  confidence_masuk: number | null;
  confidence_pulang: number | null;
  verification_method: string | null;
  ip_address: string | null;
  lokasi_masuk: string | null;
  lokasi_pulang: string | null;
  is_face_verified: boolean;
  pegawai?: Pegawai;
}

export interface Pengajuan {
  id: number;
  id_pegawai: number;
  jenis: "Cuti" | "Izin" | "Sakit" | "DinasLuar";
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  file_pendukung: string | null;
  status: "Pending" | "Disetujui" | "Ditolak";
  id_approved_by: number | null;
  alasan_penolakan: string | null;
  created_at: string;
  updated_at: string;
  pegawai?: Pegawai;
  approver?: Pegawai;
}

export interface Notifikasi {
  id: number;
  id_penerima: number;
  id_pengirim: number | null;
  judul: string;
  pesan: string;
  link: string | null;
  is_dibaca: boolean;
  created_at: string;
}

export interface Role {
  id: number;
  nama: string;
  deskripsi: string | null;
  can_admin: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  nama: string;
  grup: string;
  deskripsi: string | null;
}

export interface LokasiKantor {
  id: number;
  nama_instansi: string;
  alamat: string;
  latitude: string;
  longitude: string;
  radius: number;
}

export interface StrukturOrganisasi {
  id: number;
  nama: string;
  id_parent: number | null;
  id_pegawai_kepala: number | null;
  level: number;
  urutan: number;
  children?: StrukturOrganisasi[];
  pegawai_kepala?: Pegawai;
}

export type StatusAbsensi = "Hadir" | "Terlambat" | "Izin" | "Sakit" | "Cuti" | "Alpa";

export interface RekapAbsensi {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  cuti: number;
  alpa: number;
  total: number;
}

export interface AbsensiStatus {
  sudah_masuk: boolean;
  sudah_pulang: boolean;
  absensi_hari_ini: Absensi | null;
}
