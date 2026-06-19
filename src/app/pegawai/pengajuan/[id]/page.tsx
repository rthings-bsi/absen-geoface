"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";
import { Badge, Skeleton, Button } from "@/components/ui";
import {
  ChevronLeft,
  CalendarDays,
  FileText,
  Stethoscope,
  Home,
  Clock,
  User,
  XCircle,
  Download,
  Building,
  CheckCircle2,
} from "lucide-react";
import type { Pengajuan } from "@/types";

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  disetujui: { label: "Disetujui", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

const JENIS_ICON: Record<string, React.ReactNode> = {
  izin: <CalendarDays className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
  sakit: <Stethoscope className="h-5 w-5 text-rose-500 dark:text-rose-400" />,
  cuti: <Home className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  lembur: <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />,
};

const JENIS_LABEL: Record<string, string> = {
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
  lembur: "Lembur",
};

export default function PengajuanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [pengajuan, setPengajuan] = useState<Pengajuan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!id) {
      router.push("/pegawai/pengajuan");
      return;
    }
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pengajuan/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/pegawai/pengajuan");
          return;
        }
        throw new Error("Gagal mengambil detail pengajuan");
      }
      const data = await res.json();
      setPengajuan(data);
    } catch {
      router.push("/pegawai/pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pengajuan ini?")) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/pengajuan/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.push("/pegawai/pengajuan");
    } catch {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-32 bg-sky-100/50 dark:bg-gray-800/50" />
        <Skeleton className="h-48 rounded-3xl bg-sky-100/40 dark:bg-gray-800/40" />
        <Skeleton className="h-12 rounded-2xl bg-sky-100/30 dark:bg-gray-800/30" />
      </div>
    );
  }

  if (!pengajuan) {
    return null;
  }

  const statusConfig = STATUS_BADGE[pengajuan.status] ?? {
    label: pengajuan.status,
    variant: "outline" as const,
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
          <h1 className="text-lg font-bold text-sky-950 dark:text-sky-50">Detail Pengajuan</h1>
          <p className="text-xs text-sky-500 dark:text-sky-400">Informasi & status permohonan</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-200/50 shadow-lg shadow-sky-200/10 p-5 md:p-6 space-y-5 dark:bg-gray-900/80 dark:border-gray-700 dark:shadow-black/20">
        {/* Top summary row */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100/50 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center dark:bg-gray-800">
              {JENIS_ICON[pengajuan.jenis] ?? (
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-sky-900 capitalize dark:text-sky-100">
                {JENIS_LABEL[pengajuan.jenis] ?? pengajuan.jenis}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 dark:text-slate-500">
                Diajukan pada {formatDate(pengajuan.created_at, "datetime")}
              </p>
            </div>
          </div>
          <Badge
            variant={statusConfig.variant}
            className={cn(
              "text-xs px-3 py-1 font-bold rounded-full shadow-sm",
              pengajuan.status === "Disetujui"
                ? "bg-emerald-100 text-emerald-700 border-transparent dark:bg-gray-700 dark:text-emerald-300"
                : pengajuan.status === "Ditolak"
                ? "bg-rose-100 text-rose-700 border-transparent dark:bg-gray-800 dark:text-rose-400"
                : "bg-amber-100 text-amber-700 border-transparent dark:bg-gray-800 dark:text-amber-400"
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Info Rows */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 mt-0.5 dark:bg-gray-800 dark:text-sky-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">Tanggal Permohonan</p>
              <p className="text-sm text-slate-600 mt-0.5 dark:text-slate-300">
                {formatDate(pengajuan.tanggal_mulai)}
                {pengajuan.tanggal_selesai &&
                  ` - ${formatDate(pengajuan.tanggal_selesai)}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 mt-0.5 dark:bg-gray-800 dark:text-sky-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">Alasan Detail</p>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed dark:text-slate-300">
                {pengajuan.alasan}
              </p>
            </div>
          </div>

          {pengajuan.file_pendukung && (
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 mt-0.5 dark:bg-gray-800 dark:text-sky-400">
                <Download className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">Lampiran Pendukung</p>
                <a
                  href={pengajuan.file_pendukung}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline mt-1 bg-sky-50 px-2.5 py-1 rounded-lg transition-colors dark:text-sky-400 dark:hover:text-sky-300 dark:bg-gray-800"
                >
                  <Download className="w-3 h-3" />
                  Lihat lampiran
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Review details */}
        {pengajuan.approver && (
          <div className="border-t border-sky-100/50 pt-4 space-y-3 dark:border-gray-700">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 mt-0.5 dark:bg-gray-800 dark:text-sky-400">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-sky-900 uppercase tracking-wide dark:text-sky-100">Pemeriksa</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 dark:text-slate-200">
                  {pengajuan.approver.nama}
                </p>
                {pengajuan.updated_at && (
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 dark:text-slate-500">
                    Diproses pada {formatDate(pengajuan.updated_at, "datetime")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection alert */}
        {pengajuan.alasan_penolakan && (
          <div className="border-t border-sky-100/50 pt-4 dark:border-gray-700">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50/60 border border-rose-100/50 rounded-2xl text-rose-700 dark:bg-gray-800/60 dark:border-rose-900/50 dark:text-rose-400">
              <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5 dark:text-rose-400" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-rose-950 uppercase tracking-wide dark:text-rose-200">
                  Alasan Penolakan
                </p>
                <p className="text-xs text-rose-600 mt-1 leading-relaxed dark:text-rose-400">
                  {pengajuan.alasan_penolakan}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-1">
        <Link href="/pegawai/pengajuan" className="flex-1">
          <Button variant="outline" className="w-full py-2.5 rounded-xl border-sky-200/85 text-sky-700 hover:bg-sky-50 transition-all font-semibold active:scale-[0.98] dark:border-gray-700 dark:text-sky-300 dark:hover:bg-gray-800">
            Kembali
          </Button>
        </Link>
        {pengajuan.status === "Pending" && (
          <Button
            variant="destructive"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold shadow-md shadow-rose-200/50 transition-all active:scale-[0.98] dark:shadow-black/30"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "Membatalkan..." : "Batalkan"}
          </Button>
        )}
      </div>
    </div>
  );
}
