import { z } from "zod";

export const pengajuanSchema = z.object({
  jenis: z.enum(["Cuti", "Izin", "Sakit", "DinasLuar"], {
    required_error: "Jenis pengajuan harus dipilih",
  }),
  tanggal_mulai: z.string().min(1, "Tanggal mulai harus diisi"),
  tanggal_selesai: z.string().min(1, "Tanggal selesai harus diisi"),
  alasan: z.string().min(10, "Alasan minimal 10 karakter"),
}).refine((data) => data.tanggal_selesai >= data.tanggal_mulai, {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["tanggal_selesai"],
});
