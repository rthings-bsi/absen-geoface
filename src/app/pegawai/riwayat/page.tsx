"use client";

import { useState, useEffect } from "react";
import { formatDate, cn } from "@/lib/utils";
import { Badge, Skeleton } from "@/components/ui";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  FileText,
  Home,
  Stethoscope,
  Calendar,
  Check,
} from "lucide-react";
import type { Absensi, RekapAbsensi } from "@/types";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  Hadir: { label: "Hadir", variant: "default", icon: CheckCircle2 },
  Terlambat: { label: "Terlambat", variant: "destructive", icon: AlertTriangle },
};

const REKAP_ITEMS: { key: keyof RekapAbsensi; label: string; color: string; border: string; glow: string; textClass: string }[] = [
  { key: "hadir", label: "Tepat Waktu", color: "from-emerald-500 to-teal-500", border: "hover:border-emerald-200", glow: "group-hover:shadow-emerald-500/10", textClass: "text-emerald-600" },
  { key: "terlambat", label: "Terlambat", color: "from-amber-400 to-orange-500", border: "hover:border-amber-200", glow: "group-hover:shadow-amber-500/10", textClass: "text-amber-500" },
  { key: "izin", label: "Izin", color: "from-blue-500 to-indigo-600", border: "hover:border-blue-200", glow: "group-hover:shadow-blue-500/10", textClass: "text-blue-500" },
  { key: "sakit", label: "Sakit", color: "from-rose-500 to-pink-500", border: "hover:border-rose-200", glow: "group-hover:shadow-rose-500/10", textClass: "text-rose-500" },
  { key: "cuti", label: "Cuti", color: "from-teal-400 to-cyan-500", border: "hover:border-teal-200", glow: "group-hover:shadow-teal-500/10", textClass: "text-teal-600" },
  { key: "alpa", label: "Alpa", color: "from-slate-400 to-slate-600", border: "hover:border-slate-300", glow: "group-hover:shadow-slate-500/10", textClass: "text-slate-600" },
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

  return (
    <div className={cn("transition-all duration-500", mounted ? "opacity-100" : "opacity-0")}>
      {/* ═══ MOBILE VIEW ═══ */}
      <div className="md:hidden p-4 max-w-lg mx-auto space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Link href="/pegawai" className="p-2 rounded-xl hover:bg-slate-100 transition">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Riwayat Absensi</h1>
            <p className="text-xs text-slate-500">Log kehadiran bulanan Anda</p>
          </div>
        </div>

        {/* Month nav */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-between shadow-sm">
          <button onClick={() => navigateMonth("prev")} className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-600"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <CalendarDays className="h-4 w-4 text-sky-600" />
            {monthNames[month - 1]} {year}
          </div>
          <button onClick={() => navigateMonth("next")} disabled={!canGoNext} className="p-2 rounded-xl hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"><ChevronRight className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-slate-100/60" />)}
            </div>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-slate-100/60" />)}
          </div>
        ) : (
          <>
            {rekap && (
              <div className="grid grid-cols-3 gap-2">
                {REKAP_ITEMS.map(({ key, label, textClass }) => (
                  <div key={key} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-xs">
                    <p className={cn("text-xl font-bold tabular-nums", textClass)}>{rekap[key]}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
            {riwayat.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Belum ada data absensi</p>
                <p className="text-xs text-slate-400 mt-1">untuk bulan ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                {riwayat.map((item) => {
                  const sv = item.status_masuk || "Alpa";
                  const sc = STATUS_MAP[sv] ?? { label: sv, variant: "outline" as const };
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{formatDate(item.tanggal)}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>Masuk: {item.jam_masuk?.slice(0,5) || "--:--"}</span>
                            <span>Pulang: {item.jam_pulang?.slice(0,5) || "--:--"}</span>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-semibold px-2.5 py-0.5 border rounded-full",
                          sc.variant === "default" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {sc.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ DESKTOP VIEW ═══ */}
      <div className="hidden md:block max-w-5xl mx-auto px-6 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm shadow-sky-100/10 active:scale-95 transition-transform duration-150">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-sky-950 tracking-tight flex items-center gap-2">
                  Riwayat Absensi
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full">{riwayat.length} Hari Kerja</span>
                </h1>
                <p className="text-xs text-sky-500 font-medium">Monitoring log kehadiran bulanan anda secara real-time</p>
              </div>
            </div>
          </div>

          {/* Month navigator (Gen Z Pill in Sky) */}
          <div className="flex items-center gap-2 bg-white border border-sky-200 p-1.5 shadow-lg shadow-sky-100/50">
            <button onClick={() => navigateMonth("prev")} className="p-2 rounded-xl hover:bg-sky-50 active:scale-90 transition-all text-sky-600"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-2.5 px-4 font-extrabold text-xs tracking-wider uppercase tracking-widest min-w-[150px] justify-center text-sky-950">
              <CalendarDays className="w-4 h-4 text-sky-500" />
              <span>{monthNames[month - 1].slice(0, 3)} · {year}</span>
            </div>
            <button onClick={() => navigateMonth("next")} disabled={!canGoNext} className="p-2 rounded-xl hover:bg-sky-50 active:scale-90 transition-all disabled:opacity-20 text-sky-600"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl bg-slate-100" />)}
            </div>
            <Skeleton className="h-64 rounded-3xl bg-slate-100" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Rekap Bento Grid ── */}
            <div className="grid grid-cols-7 gap-3">
              {/* Circular KPI - Sky & White */}
              <div className="col-span-1 bg-white border border-sky-200 rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg shadow-sky-100/30 hover:-translate-y-0.5 transition-transform duration-300">
                <div className="relative w-16 h-16 mb-2">
                  <svg width="64" height="64" className="-rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#f0f9ff" strokeWidth={5.5} />
                    <circle cx="32" cy="32" r="26" fill="none"
                      stroke="#0284c7"
                      strokeWidth={5.5} strokeLinecap="round"
                      strokeDasharray={163.36}
                      strokeDashoffset={163.36 - (pct / 100) * 163.36}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black text-sky-950 tabular-nums">{pct}%</span>
                  </div>
                </div>
                <p className="text-[9px] text-sky-600 font-extrabold uppercase tracking-widest leading-none">Rasio</p>
              </div>

              {/* Items */}
              {REKAP_ITEMS.map(({ key, label, color, border, glow, textClass }) => (
                <div key={key} className={cn(
                  "bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between group",
                  "hover:bg-slate-50 hover:shadow-xl hover:shadow-slate-100/50",
                  "transition-all duration-300",
                  border
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">{label}</span>
                    <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", color)} />
                  </div>
                  <p className={cn("text-3xl font-black tabular-nums mt-4 leading-none tracking-tight", textClass)}>
                    {rekap?.[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Table Layout ── */}
            {riwayat.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">Belum ada data absensi</p>
                <p className="text-xs text-slate-400 mt-0.5">Log absensi untuk bulan ini masih kosong</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sky-50 border-b border-sky-100">
                      <th className="px-6 py-4 text-[10px] font-extrabold text-sky-950 uppercase tracking-widest">Tanggal</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-sky-950 uppercase tracking-widest">Jam Masuk</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-sky-950 uppercase tracking-widest">Jam Pulang</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-sky-950 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riwayat.map((item) => {
                      const sv = item.status_masuk || "Alpa";
                      const sc = STATUS_MAP[sv] ?? { label: sv, variant: "outline" as const, icon: XCircle };
                      const isTerlambat = sv === "Terlambat";
                      const dateObj = new Date(item.tanggal);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110",
                                isTerlambat
                                  ? "bg-amber-50 border-amber-100 text-amber-500 shadow-sm shadow-amber-500/5"
                                  : "bg-emerald-50 border-emerald-100 text-emerald-500 shadow-sm shadow-emerald-500/5"
                              )}>
                                {isTerlambat ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 leading-none">
                                  {dateObj.toLocaleDateString("id-ID", { weekday: "long" })}
                                </span>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="text-xs text-slate-800 font-bold tabular-nums">
                              {item.jam_masuk?.slice(0,5) || <span className="text-slate-300 font-normal">--:--</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="text-xs text-slate-800 font-bold tabular-nums">
                              {item.jam_pulang?.slice(0,5) || <span className="text-slate-300 font-normal">--:--</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <Badge className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm",
                              isTerlambat
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {sc.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Summary */}
            {riwayat.length > 0 && (
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-white border border-slate-200 rounded-2xl px-6 py-4.5 shadow-sm">
                <span>Terdata {riwayat.length} Hari Kerja</span>
                <span className="text-slate-500">{totalHadir} Hadir · {totalAbsen - totalHadir} Mangkir/Izin</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
