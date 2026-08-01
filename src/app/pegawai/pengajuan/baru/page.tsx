"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, Loader2, Upload, CalendarDays, ClipboardList, Check,
  FileText, MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JENIS_OPTIONS = [
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "cuti", label: "Cuti" },
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
  const tanggalMulaiRef = useRef<HTMLInputElement>(null);
  const tanggalSelesaiRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!jenis) errs.jenis = "Pilih jenis pengajuan";
    if (!tanggalMulai) errs.tanggalMulai = "Pilih tanggal mulai";
    else if (tanggalMulai < todayStr) errs.tanggalMulai = "Tidak dapat mengajukan untuk tanggal yang sudah lewat";
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

      const res = await fetch("/api/pengajuan", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal mengirim pengajuan");
      }
      toast.success("Pengajuan berhasil dikirim");
      router.push("/pegawai/pengajuan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally { setIsSubmitting(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) { setFile(null); return; }
    const maxSize = 5 * 1024 * 1024;
    if (selected.size > maxSize) { toast.error("File maksimal 5MB"); e.target.value = ""; return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(selected.type)) { toast.error("Hanya file JPG, PNG, atau PDF"); e.target.value = ""; return; }
    setFile(selected);
  };

  return (
    <>
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-28 md:pb-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 mb-4 md:mb-6 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex items-center gap-3 sm:gap-4">
          <Link href="/pegawai/pengajuan" className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all rounded-full shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-none mb-1">Pengajuan Baru</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Buat permohonan baru</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-5 md:p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detail Pengajuan</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis">Jenis Pengajuan <span className="text-rose-500">*</span></Label>
                  <Select value={jenis} onValueChange={setJenis}>
                    <SelectTrigger id="jenis" className={errors.jenis ? "border-rose-300 dark:border-rose-700" : ""}>
                      <SelectValue placeholder="Pilih jenis pengajuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jenis && <p className="text-[10px] font-semibold text-rose-500">{errors.jenis}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggal_mulai">Tanggal Mulai <span className="text-rose-500">*</span></Label>
                    <div className="relative">
                      <input ref={tanggalMulaiRef} id="tanggal_mulai" type="date" min={todayStr} value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)}
                        className={cn(
                          "w-full rounded-xl border pl-3.5 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800 text-on-surface focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all cursor-pointer [color-scheme:dark]",
                          errors.tanggalMulai ? "border-rose-300 dark:border-rose-700" : "border-slate-200 dark:border-slate-700"
                        )} />
                      <button type="button" onClick={() => tanggalMulaiRef.current?.showPicker()} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                        <CalendarDays className="w-5 h-5" />
                      </button>
                    </div>
                    {errors.tanggalMulai && <p className="text-[10px] font-semibold text-rose-500">{errors.tanggalMulai}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                    <div className="relative">
                      <input ref={tanggalSelesaiRef} id="tanggal_selesai" type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} min={tanggalMulai || undefined}
                        className={cn(
                          "w-full rounded-xl border pl-3.5 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800 text-on-surface focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all cursor-pointer [color-scheme:dark]",
                          errors.tanggalSelesai ? "border-rose-300 dark:border-rose-700" : "border-slate-200 dark:border-slate-700"
                        )} />
                      <button type="button" onClick={() => tanggalSelesaiRef.current?.showPicker()} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                        <CalendarDays className="w-5 h-5" />
                      </button>
                    </div>
                    {errors.tanggalSelesai && <p className="text-[10px] font-semibold text-rose-500">{errors.tanggalSelesai}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alasan">Alasan Pengajuan <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <MessageSquareText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea id="alasan" value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={4} maxLength={500} placeholder="Jelaskan detail alasan pengajuan permohonan Anda..."
                      className={cn(
                        "w-full rounded-xl border pl-9 py-3 text-sm bg-slate-50 dark:bg-slate-800 text-on-surface focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-400",
                        errors.alasan ? "border-rose-300 dark:border-rose-700" : "border-slate-200 dark:border-slate-700"
                      )} />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    {errors.alasan ? <p className="text-[10px] font-semibold text-rose-500">{errors.alasan}</p> : <div />}
                    <p className="text-[10px] text-slate-400 font-semibold">{alasan.length}/500 karakter</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lampiran</h3>
              </div>
              <div className="space-y-1.5">
                <Label>Lampiran Pendukung (opsional)</Label>
                <label className={cn(
                  "flex items-center justify-center gap-2.5 w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  file ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-slate-800/50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
                )}>
                  {file ? (
                    <div className="text-center p-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-1 text-indigo-600 dark:text-indigo-400">
                        <Check className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-xs font-bold text-on-surface max-w-[250px] truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Upload className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                      <p className="text-[11px] font-semibold text-on-surface">Pilih file pendukung</p>
                      <p className="text-[9px] mt-0.5 font-medium">Format JPG, PNG, PDF (maks 5MB)</p>
                    </div>
                  )}
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href="/pegawai/pengajuan" className="flex-1">
                <button type="button" className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-all">Batal</button>
              </Link>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</> : "Kirim Pengajuan"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
