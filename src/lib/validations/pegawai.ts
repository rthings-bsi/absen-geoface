import { z } from "zod";

export const pegawaiSchema = z.object({
  nip: z.string().min(5, "NIP minimal 5 karakter"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  tempat_lahir: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  jenis_kelamin: z.enum(["L", "P"]).optional(),
  no_hp: z.string().optional(),
  alamat: z.string().optional(),
  id_jabatan: z.number().optional().nullable(),
  id_jam_kerja: z.number().optional().nullable(),
  id_role: z.number().optional().nullable(),
  role: z.enum(["Admin", "Pegawai"]).default("Pegawai"),
});

export const updateProfilSchema = z.object({
  no_hp: z.string().optional(),
  alamat: z.string().optional(),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, "Password lama harus diisi"),
  new_password: z.string().min(6, "Password baru minimal 6 karakter"),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Password baru tidak cocok",
  path: ["confirm_password"],
});
