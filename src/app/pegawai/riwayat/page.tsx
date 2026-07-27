"use client";

import { useState, useEffect } from "react";
import { formatDate, cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { Absensi, RekapAbsensi } from "@/types";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; icon: any; classes: string }> = {
  Hadir: { label: "Hadir", icon: CheckCircle2, classes: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" },
  Terlambat: { label: "Terlambat", icon: AlertTriangle, classes: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900" },
};

const REKAP_ITEMS: { key: keyof RekapAbsensi; label: string; color: string; textClass: string }[] = [
  { key: "hadir", label: "Tepat Waktu", color: "#006c4a", textClass: "text-[#006c4a] dark:text-emerald-400" },
  { key: "terlambat", label: "Terlambat", color: "#d97706", textClass: "text-amber-600 dark:text-amber-400" },
  { key: "izin", label: "Izin", color: "#2563eb", textClass: "text-blue-600 dark:text-blue-400" },
  { key: "sakit", label: "Sakit", color: "#e11d48", textClass: "text-rose-600 dark:text-rose-400" },
  { key: "cuti", label: "Cuti", color: "#0d9488", textClass: "text-teal-600 dark:text-teal-400" },
  { key: "alpa", label: "Alpa", color: "#64748b", textClass: "text-slate-500 dark:text-slate-400" },
];

export default function RiwayatPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [riwayat, setRiwayat] = useState<Absensi[]>([]);
  const [rekap, setRekap] = useState<RekapAbsensi | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchRiwayat(); }, [month, year]);

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi/riwayat?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setRiwayat(data.absensi ?? []);
      setRekap(data.rekap ?? null);
    } catch {
      setRiwayat([]);
      setRekap(null);
    } finally { setLoading(false); }
  };

  const navigateMonth = (dir: "prev" | "next") => {
    if (dir === "prev") {
      if (month === 1) { setMonth(12); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const totalHadir = (rekap?.hadir || 0) + (rekap?.terlambat || 0);
  const totalAbsen = rekap?.total || 1;
  const pct = Math.round((totalHadir / totalAbsen) * 100);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative font-['Inter',sans-serif] text-on-surface selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617]">
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-32 md:pb-12">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 mb-6 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/pegawai/dashboard" className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all rounded-full shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-none mb-1">Riwayat Absensi</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Log kehadiran bulanan Anda</p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 shadow-sm shrink-0 self-start sm:self-auto">
            <button onClick={() => navigateMonth("prev")} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition-all text-slate-500 dark:text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 font-bold text-xs text-slate-700 dark:text-slate-300 min-w-[130px] justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-[#1e1b4b] dark:text-indigo-400" />
              <span>{monthNames[month - 1]} {year}</span>
            </div>
            <button onClick={() => navigateMonth("next")} disabled={!canGoNext} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition-all disabled:opacity-20 text-slate-500 dark:text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rekap Grid */}
            {rekap && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {REKAP_ITEMS.map(({ key, label, color, textClass }) => {
                  const Icon = key === "hadir" ? CheckCircle2 : key === "terlambat" ? AlertTriangle : Clock;
                  return (
                    <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex flex-col items-center text-center gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <p className={cn("text-xl font-black tabular-nums leading-none", textClass)}>
                        {rekap[key] ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Absensi List / Table */}
            {riwayat.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-14 text-center">
                <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada data absensi</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">untuk bulan ini</p>
              </div>
            ) : (
              <>
                {/* Mobile: Card List */}
                <div className="md:hidden space-y-2">
                  {riwayat.map((item) => {
                    const sv = item.status_masuk || "Alpa";
                    const sc = STATUS_MAP[sv] ?? { label: sv, classes: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: XCircle };
                    const Icon = sc.icon;
                    return (
                      <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm text-on-surface">{formatDate(item.tanggal)}</p>
                          <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1", sc.classes)}>
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>Masuk: {item.jam_masuk?.slice(0,5) || "--:--"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>Pulang: {item.jam_pulang?.slice(0,5) || "--:--"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tanggal</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:table-cell">Jam Masuk</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:table-cell">Jam Pulang</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {riwayat.map((item) => {
                        const sv = item.status_masuk || "Alpa";
                        const isTerlambat = sv === "Terlambat";
                        const sc = STATUS_MAP[sv] ?? { label: sv, classes: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: XCircle };
                        const Icon = sc.icon;
                        const dateObj = new Date(item.tanggal);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4.5">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                                  isTerlambat
                                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900 text-amber-500 dark:text-amber-400"
                                    : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900 text-[#006c4a] dark:text-emerald-400"
                                )}>
                                  {isTerlambat ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-on-surface leading-none">{dateObj.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                    {dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 hidden sm:table-cell">
                              <span className="text-xs font-bold text-on-surface tabular-nums">
                                {item.jam_masuk?.slice(0,5) || <span className="text-slate-400 dark:text-slate-600 font-normal">--:--</span>}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 hidden sm:table-cell">
                              <span className="text-xs font-bold text-on-surface tabular-nums">
                                {item.jam_pulang?.slice(0,5) || <span className="text-slate-400 dark:text-slate-600 font-normal">--:--</span>}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm inline-flex items-center gap-1", sc.classes)}>
                                <Icon className="w-3 h-3" />
                                {sc.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Footer Summary */}
            {riwayat.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none rounded-2xl px-5 py-4">
                <span>Terdata {riwayat.length} Hari Kerja</span>
                <span className="text-slate-600 dark:text-slate-300">{totalHadir} Hadir · {totalAbsen - totalHadir} Mangkir/Izin</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
