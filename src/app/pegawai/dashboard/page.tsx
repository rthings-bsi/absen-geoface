"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Camera,
  CalendarDays,
  Bell,
  ArrowRight,
  Clock,
  User,
  MapPin,
  BarChart3,
  FileText,
  ChevronRight,
  Timer,
  Zap,
  Coffee,
  Moon,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { AbsensiStatus, RekapAbsensi, Notifikasi } from "@/types";

// ─── Static data ───────────────────────────────────────────────────────────
const ALL_LINKS = [
  { href: "/pegawai/riwayat", label: "Riwayat", desc: "Riwayat absensi", icon: Clock, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/10", tag: "Aktifitas" },
  { href: "/pegawai/pengajuan", label: "Pengajuan", desc: "Cuti, izin, sakit", icon: FileText, color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/10", tag: "Administrasi" },
  { href: "/pegawai/absensi", label: "Absensi", desc: "Presensi hari ini", icon: Camera, color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/10", tag: "Harian" },
  { href: "/pegawai/profil", label: "Profil", desc: "Data pribadi", icon: User, color: "from-sky-400 to-blue-500", shadow: "shadow-sky-500/10", tag: "Akun" },
] as const;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
};

const getGreetingEmoji = () => {
  const h = new Date().getHours();
  if (h < 12) return <Sun className="w-4 h-4 text-amber-400" />;
  if (h < 15) return <Zap className="w-4 h-4 text-amber-400" />;
  if (h < 18) return <Coffee className="w-4 h-4 text-amber-400" />;
  return <Moon className="w-4 h-4 text-indigo-300" />;
};

// ─── Progress Ring ─────────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 56, strokeWidth = 4, color = "stroke-sky-500" }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={cn(color, "transition-all duration-700 ease-out")}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// ─── Subtle Ambient Glows ──────────────────────────────────────────────────
function BgDecor() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/20 via-indigo-100/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/10 via-sky-100/15 to-transparent rounded-full blur-3xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PegawaiDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [absensiStatus, setAbsensiStatus] = useState<AbsensiStatus | null>(null);
  const [rekap, setRekap] = useState<RekapAbsensi | null>(null);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [statusRes, rekapRes, notifRes] = await Promise.all([
          fetch("/api/absensi/status"),
          fetch("/api/absensi/rekap-bulanan"),
          fetch("/api/notifikasi?limit=5"),
        ]);
        if (cancelled) return;
        if (statusRes.ok) setAbsensiStatus(await statusRes.json());
        if (rekapRes.ok) setRekap(await rekapRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ─── Derived data ────────────────────────────────────────────────────────
  const totalHadir = (rekap?.hadir || 0) + (rekap?.terlambat || 0);
  const totalAbsen = rekap?.total || 1;
  const persentase = Math.round((totalHadir / totalAbsen) * 100);

  const unreadNotif = useMemo(() => notifications.filter(n => !n.is_dibaca).length, [notifications]);

  const absensiStatusBadge = loading
    ? { label: "Memuat...", variant: "default" as const }
    : absensiStatus?.sudah_pulang
    ? { label: "Selesai", variant: "success" as const }
    : absensiStatus?.sudah_masuk
    ? { label: "Sedang Berjalan", variant: "info" as const }
    : { label: "Belum Mulai", variant: "pending" as const };

  const stats = [
    { label: "Total Hari", value: totalAbsen, color: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
    { label: "Hadir Tepat", value: rekap?.hadir || 0, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Terlambat", value: rekap?.terlambat || 0, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    { label: "Kehadiran", value: `${persentase}%`, color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
  ];

  const breakdown = [
    { label: "Sakit", value: rekap?.sakit || 0, color: "text-rose-600", bar: "bg-rose-400" },
    { label: "Cuti", value: rekap?.cuti || 0, color: "text-sky-600", bar: "bg-sky-400" },
    { label: "Izin", value: rekap?.izin || 0, color: "text-amber-600", bar: "bg-amber-400" },
    { label: "Alpha", value: rekap?.alpa || 0, color: "text-slate-500", bar: "bg-slate-300" },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      "transition-all duration-500 relative",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <BgDecor />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-5 md:pt-7 pb-8">

        {/* ═══ HEADER ═══ */}
        <header className="flex items-center justify-between mb-7">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 shadow-xs">
                {getGreetingEmoji()}
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                  {greeting()}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {session?.user?.nama || "Pegawai"}
            </h1>
            <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <CalendarDays className="w-4 h-4 text-sky-500" />
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

        </header>

        {/* ═══ BENTO GRID ═══ */}
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ──────── LEFT COLUMN (8 cols) ──────── */}
            <div className="lg:col-span-8 space-y-5">

              {/* ── HERO: Absensi Card ── */}
              <Link href="/pegawai/absensi" className="block group">
                <div className={cn(
                  "relative overflow-hidden rounded-3xl border shadow-sm transition-all duration-300",
                  "bg-gradient-to-br from-sky-50/50 via-white to-sky-50/50 border-sky-200/60",
                  "hover:shadow-md hover:border-sky-300/85"
                )}>
                  {/* Subtle Glow Node */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-200/20 to-transparent rounded-full blur-2xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-500/20 flex items-center justify-center text-white">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Absensi Hari Ini</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={absensiStatusBadge.variant}
                        className={cn(
                          "border text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs",
                          absensiStatus?.sudah_pulang
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : absensiStatus?.sudah_masuk
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
                          absensiStatus?.sudah_pulang ? "bg-emerald-500" : absensiStatus?.sudah_masuk ? "bg-blue-500 animate-pulse" : "bg-slate-400"
                        )} />
                        {absensiStatusBadge.label}
                      </Badge>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Left: Avatar & Inputs */}
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-14 h-14 rounded-2xl border-2 border-sky-200/50 shrink-0 shadow-inner">
                          <AvatarImage src={session?.user?.foto_profile || undefined} alt={session?.user?.nama || "P"} className="object-cover" />
                          <AvatarFallback className="rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 text-xl font-black text-sky-700">
                            {session?.user?.nama?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid grid-cols-2 gap-3 flex-1">
                          <div className="bg-white/80 rounded-2xl px-4 py-3 border border-sky-100/80 shadow-xs">
                            <div className="flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5 text-sky-500" />
                              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Jam Masuk</p>
                            </div>
                            <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-none">
                              {absensiStatus?.sudah_masuk ? absensiStatus.absensi_hari_ini?.jam_masuk?.slice(0, 5) : <span className="text-slate-300 font-bold">--:--</span>}
                            </p>
                          </div>
                          <div className="bg-white/80 rounded-2xl px-4 py-3 border border-sky-100/80 shadow-xs">
                            <div className="flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5 text-sky-500" />
                              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Jam Pulang</p>
                            </div>
                            <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-none">
                              {absensiStatus?.sudah_pulang ? absensiStatus.absensi_hari_ini?.jam_pulang?.slice(0, 5) : <span className="text-slate-300 font-bold">--:--</span>}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Info & Detail */}
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-1.5 shrink-0 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                          <MapPin className="w-4 h-4 text-sky-500" />
                          <span>Terverifikasi</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-sky-600 group-hover:underline">
                          <span>Absen</span>
                          <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center group-hover:bg-sky-100/80 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* ── STATS: 4 columns (Gen Z Bento style) ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white rounded-3xl border border-slate-200/80 p-5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/30 transition-all duration-300 group">
                    <p className={cn("text-2xl font-black tabular-nums leading-none tracking-tight", s.color)}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-2">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ── QUICK LINKS (Grid cards) — desktop only ── */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Menu Pintasan</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALL_LINKS.map((l) => {
                    const Icon = l.icon;
                    return (
                      <Link key={l.href} href={l.href}
                        className="group flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 shadow-xs hover:border-slate-200/80 active:scale-95 transition-all duration-200"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 transition-all duration-300 shadow-sm",
                          l.color,
                          l.shadow,
                          "group-hover:scale-105 group-hover:rotate-3"
                        )}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700 transition-colors truncate">{l.label}</p>
                          <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5 truncate">{l.tag}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-sky-500 transition-all duration-250 group-hover:translate-x-0.5 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ──────── RIGHT COLUMN (4 cols) ──────── */}
            <aside className="lg:col-span-4 space-y-5">

              {/* ── NOTIFIKASI (Desktop Only) ── */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4.5 h-4.5 text-slate-600" />
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifikasi</h2>
                  </div>
                  {unreadNotif > 0 && (
                    <span className="text-[10px] font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                      {unreadNotif} baru
                    </span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Semua notifikasi telah dibaca</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {notifications.slice(0, 4).map((n) => (
                      <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="relative mt-1 shrink-0">
                          <div className={cn("w-2 h-2 rounded-full", n.is_dibaca ? "bg-slate-200" : "bg-sky-500")} />
                          {!n.is_dibaca && <span className="absolute inset-0 rounded-full bg-sky-500 animate-ping opacity-60" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs leading-snug", n.is_dibaca ? "text-slate-500 font-medium" : "text-slate-800 font-bold")}>{n.judul}</p>
                          <p className="text-[9px] text-slate-400 font-semibold tracking-wider mt-0.5">{formatDate(n.created_at, "datetime")}</p>
                        </div>
                      </div>
                    ))}
                    <Link href="/pegawai/notifikasi" className="flex items-center justify-center gap-1 mt-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-sky-600 pt-3 border-t border-slate-100 transition-colors">
                      Lihat Semua Notifikasi
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* ── RINCIAN / METRICS (Desktop Only) ── */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4.5 h-4.5 text-slate-600" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rincian Bulan Ini</h2>
                </div>

                <div className="flex items-center gap-4.5 mb-5 pb-5 border-b border-slate-100">
                  <div className="relative">
                    <ProgressRing percentage={persentase} size={64} strokeWidth={4.5} color={persentase >= 80 ? "stroke-emerald-500" : persentase >= 50 ? "stroke-amber-500" : "stroke-rose-500"} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black text-slate-800 tabular-nums">{persentase}%</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-900 tabular-nums leading-none">{totalHadir} <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hari Hadir</span></p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Dari {totalAbsen} hari kerja</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {breakdown.map((b) => {
                    const maxVal = Math.max(...breakdown.map(x => x.value), 1);
                    const barW = maxVal > 0 ? (b.value / maxVal) * 100 : 0;
                    return (
                      <div key={b.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-500">{b.label}</span>
                          <span className={cn("text-xs font-extrabold tabular-nums", b.color)}>{b.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-50/80 border border-slate-100/50">
                          <div className={cn("h-full rounded-full transition-all duration-500", b.bar)} style={{ width: `${barW}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-pulse">
      <div className="lg:col-span-8 space-y-5">
        <div className="h-36 rounded-3xl bg-slate-100/60" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-3xl bg-slate-100/60" />)}
        </div>
        <div className="h-28 rounded-3xl bg-slate-100/60" />
      </div>
      <div className="lg:col-span-4 space-y-5">
        <div className="h-44 rounded-3xl bg-slate-100/60" />
        <div className="h-44 rounded-3xl bg-slate-100/60" />
      </div>
    </div>
  );
}
