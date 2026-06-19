"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { ChevronLeft, Loader2, Upload, CalendarDays, ClipboardList, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const JENIS_OPTIONS = [
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "cuti", label: "Cuti" },
  { value: "lembur", label: "Lembur" },
];

export default function PengajuanBaruPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [jenis, setJenis] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!jenis) errs.jenis = "Pilih jenis pengajuan";
    if (!tanggalMulai) errs.tanggalMulai = "Pilih tanggal mulai";
    if (!alasan.trim()) errs.alasan = "Alasan harus diisi";
    if (alasan.trim().length < 10) errs.alasan = "Alasan minimal 10 karakter";
    if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) {
      errs.tanggalSelesai = "Tanggal selesai tidak boleh sebelum tanggal mulai";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jenis", jenis);
      formData.append("tanggal_mulai", tanggalMulai);
      if (tanggalSelesai) formData.append("tanggal_selesai", tanggalSelesai);
      formData.append("alasan", alasan.trim());
      if (file) formData.append("lampiran", file);

      const res = await fetch("/api/pengajuan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal mengirim pengajuan");
      }

      toast.success("Pengajuan berhasil dikirim");
      router.push("/pegawai/pengajuan");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (selected.size > maxSize) {
      toast.error("File maksimal 5MB");
      e.target.value = "";
      return;
    }
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(selected.type)) {
      toast.error("Hanya file JPG, PNG, atau PDF");
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  return (
    <div className={cn(
      "p-4 max-w-lg mx-auto space-y-4 pb-28 transition-all duration-500",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/pegawai/pengajuan"
          className="p-2 rounded-xl hover:bg-sky-50 text-sky-500 hover:text-sky-700 transition dark:hover:bg-gray-800 dark:text-sky-400 dark:hover:text-sky-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-sky-950 dark:text-sky-50">Pengajuan Baru</h1>
          <p className="text-xs text-sky-500 dark:text-sky-400">Buat permohonan baru</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-200/50 shadow-lg shadow-sky-200/10 p-5 md:p-6 dark:bg-gray-900/80 dark:border-gray-700 dark:shadow-black/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Jenis */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">
              Jenis Pengajuan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className={cn(
                  "w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white/80 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all appearance-none cursor-pointer dark:bg-gray-800/80 dark:text-sky-100 dark:focus:ring-sky-500/30 dark:focus:border-sky-500",
                  errors.jenis ? "border-rose-300 dark:border-rose-700" : "border-sky-200/60 dark:border-gray-700"
                )}
              >
                <option value="">Pilih jenis pengajuan</option>
                {JENIS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-sky-500 dark:text-sky-400">
                <ChevronLeft className="w-4 h-4 rotate-270" />
              </div>
            </div>
            {errors.jenis && (
              <p className="text-[10px] font-semibold text-rose-500 mt-1 dark:text-rose-400">{errors.jenis}</p>
            )}
          </div>

          {/* Date range grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 pointer-events-none dark:text-sky-500" />
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm bg-white/80 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all dark:bg-gray-800/80 dark:text-sky-100 dark:focus:ring-sky-500/30 dark:focus:border-sky-500 [color-scheme:dark]",
                    errors.tanggalMulai ? "border-rose-300 dark:border-rose-700" : "border-sky-200/60 dark:border-gray-700"
                  )}
                />
              </div>
              {errors.tanggalMulai && (
                <p className="text-[10px] font-semibold text-rose-500 mt-1 dark:text-rose-400">
                  {errors.tanggalMulai}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">
                Tanggal Selesai
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 pointer-events-none dark:text-sky-500" />
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  min={tanggalMulai || undefined}
                  className={cn(
                    "w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm bg-white/80 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all dark:bg-gray-800/80 dark:text-sky-100 dark:focus:ring-sky-500/30 dark:focus:border-sky-500 [color-scheme:dark]",
                    errors.tanggalSelesai ? "border-rose-300 dark:border-rose-700" : "border-sky-200/60 dark:border-gray-700"
                  )}
                />
              </div>
              {errors.tanggalSelesai && (
                <p className="text-[10px] font-semibold text-rose-500 mt-1 dark:text-rose-400">
                  {errors.tanggalSelesai}
                </p>
              )}
            </div>
          </div>

          {/* Alasan */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">
              Alasan Pengajuan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Jelaskan detail alasan pengajuan permohonan Anda..."
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white/80 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all resize-none dark:bg-gray-800/80 dark:text-sky-100 dark:placeholder:text-gray-500 dark:focus:ring-sky-500/30 dark:focus:border-sky-500",
                errors.alasan ? "border-rose-300 dark:border-rose-700" : "border-sky-200/60 dark:border-gray-700"
              )}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.alasan ? (
                <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">{errors.alasan}</p>
              ) : (
                <div />
              )}
              <p className="text-[10px] text-slate-400 font-semibold dark:text-slate-500">
                {alasan.length}/500 karakter
              </p>
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">
              Lampiran Pendukung (opsional)
            </label>
            <label className={cn(
              "flex items-center justify-center gap-2.5 w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
              file
                ? "border-sky-500 bg-sky-50/50 dark:border-sky-500 dark:bg-gray-800/50"
                : "border-sky-200/80 bg-white/50 hover:bg-sky-50/30 hover:border-sky-300 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800/30 dark:hover:border-gray-600"
            )}>
              {file ? (
                <div className="text-center p-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center mx-auto mb-1 text-sky-600 dark:bg-gray-700 dark:text-sky-400">
                    <Check className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-xs text-sky-850 font-bold max-w-[250px] truncate dark:text-sky-200">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-sky-500 font-medium mt-0.5 dark:text-sky-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center p-3 text-slate-400">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-sky-400 animate-pulse dark:text-sky-500" />
                  <p className="text-[11px] font-semibold text-sky-850 dark:text-sky-200">
                    Pilih file pendukung
                  </p>
                  <p className="text-[9px] mt-0.5 font-medium">
                    Format JPG, PNG, PDF (maks 5MB)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-3">
            <Link href="/pegawai/pengajuan" className="flex-1">
              <Button type="button" variant="outline" className="w-full py-2.5 rounded-xl border-sky-200/80 text-sky-700 hover:bg-sky-50 transition-all font-semibold active:scale-[0.98] dark:border-gray-700 dark:text-sky-300 dark:hover:bg-gray-800">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold shadow-md shadow-sky-200/50 transition-all active:scale-[0.98] dark:shadow-black/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Pengajuan"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
