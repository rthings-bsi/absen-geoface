"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScanFace,
  CalendarClock,
  Bell,
  ArrowRight,
  CircleUserRound,
  MapPin,
  LineChart,
  FileSignature,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Flame,
  Zap,
  Coffee,
  Moon,
  Sun,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Timer,
  Award,
  ChevronRight,
  ShieldCheck,
  CalendarRange,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import type { AbsensiStatus, RekapAbsensi, Notifikasi } from "@/types";

// ─── Static data ───────────────────────────────────────────────────────────
const ALL_LINKS = [
  { href: "/pegawai/absensi", label: "Absensi", desc: "Presensi harian", icon: ScanFace, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", tag: "Presensi", vibe: "📸" },
  { href: "/pegawai/riwayat", label: "Riwayat", desc: "Log aktivitas", icon: CalendarClock, color: "from-amber-500 to-amber-600", bg: "bg-amber-500/10", tag: "Aktifitas", vibe: "📅" },
  { href: "/pegawai/pengajuan", label: "Pengajuan", desc: "Cuti & izin", icon: FileSignature, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", tag: "Administrasi", vibe: "✍️" },
  { href: "/pegawai/profil", label: "Profil", desc: "Data diri", icon: CircleUserRound, color: "from-sky-500 to-sky-600", bg: "bg-sky-500/10", tag: "Akun", vibe: "👤" },
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
  if (h < 12) return <>☀️</>;
  if (h < 15) return <>⚡</>;
  if (h < 18) return <>☕</>;
  return <>🌙</>;
};

const getIconForNotification = (judul: string) => {
  const text = judul.toLowerCase();
  if (text.includes("pengajuan") || text.includes("cuti") || text.includes("izin")) return <CalendarDays className="w-3.5 h-3.5 text-orange-500" />;
  if (text.includes("ditolak") || text.includes("gagal") || text.includes("peringatan")) return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
  if (text.includes("disetujui") || text.includes("berhasil") || text.includes("hadir")) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  return <Info className="w-3.5 h-3.5 text-sky-500" />;
};

// ─── Animated Counter ────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    prevValue.current = value;
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <>{display}</>;
}

// ─── Live Clock ──────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums tracking-tight font-bold">
      {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

// ─── Progress Ring ─────────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 120, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const isGood = percentage >= 80;
  const isMid = percentage >= 50;
  const fromColor = isGood ? "#22c55e" : isMid ? "#f59e0b" : "#f43f5e";
  const toColor = isGood ? "#059669" : isMid ? "#d97706" : "#e11d48";

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-label={`Kehadiran ${percentage} persen`}>
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        stroke="url(#progressGrad)"
        className="transition-all duration-1000 ease-out"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 8px ${fromColor}60)` }}
      />
    </svg>
  );
}

// ─── Shimmer ────────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[28px] bg-slate-100 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40", className)}>
      <div className="absolute inset-0 -translate-x-full shimmer animate-[shimmer-x_2s_infinite_linear]" />
    </div>
  );
}

// ─── Gen Z Card wrapper ────────────────────────────────────────────────────
function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border-[2.5px] p-6 shadow-sm",
        "transition-all duration-200 hover:-translate-y-1.5 active:scale-[0.97]",
        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.06)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.06)]",
        "bg-white border-slate-200/80 dark:border-slate-800/80",
        "hover:border-slate-300 dark:hover:border-slate-600",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, border, delay = 0, vibe = "" }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string; border?: string; delay?: number; vibe?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[28px] border-[3px] p-5",
        "transition-all duration-200 hover:-translate-y-2 active:scale-[0.93]",
        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.08)]",
        "animate-stagger",
        border || "border-slate-300 dark:border-slate-700",
        "hover:border-slate-900 dark:hover:border-white"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("absolute inset-0 transition-all duration-500", bg, "group-hover:scale-105")} />
      <div className={cn("absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-30 transition-all duration-500 group-hover:opacity-60 group-hover:scale-150", bg)} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <div className={cn(
            "w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-300",
            "group-hover:rotate-[8deg] group-hover:scale-110",
            "bg-white/80 dark:bg-white/10 backdrop-blur-sm shadow-sm",
            color
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {vibe && (
            <span className="text-lg leading-none opacity-60 group-hover:opacity-100 transition-opacity">{vibe}</span>
          )}
        </div>

        <p className={cn(
          "text-3xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none mt-4 mb-1",
          "bg-gradient-to-br bg-clip-text text-transparent", color
        )}>
          <AnimatedCounter value={value} />
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <div className={cn("w-1.5 h-1.5 rounded-full", color.split(" ")[0].replace("from", "bg"))} />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PegawaiDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
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
        setLoading(true);
        const safeJson = (res: Response) => {
          if (!res.ok) return null;
          if (res.status === 204) return null;
          return res.json().catch(() => null);
        };

        const [statusRes, rekapRes, notifRes] = await Promise.allSettled([
          fetch("/api/absensi/status").then(safeJson),
          fetch("/api/absensi/rekap-bulanan").then(safeJson),
          fetch("/api/notifikasi?limit=5").then(res => res.ok ? res.json().catch(() => []) : []),
        ]);
        if (cancelled) return;
        if (statusRes.status === 'fulfilled') setAbsensiStatus(statusRes.value);
        if (rekapRes.status === 'fulfilled') setRekap(rekapRes.value);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleNotificationClick = useCallback(async (n: Notifikasi) => {
    if (!n.is_dibaca) {
      try {
        await fetch(`/api/notifikasi/${n.id}`, { method: "PATCH" });
        setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_dibaca: true } : item)));
      } catch (err) { console.error(err); }
    }
    if (n.link) router.push(n.link);
  }, [router]);

  const totalHadir = (rekap?.hadir || 0) + (rekap?.terlambat || 0);
  const totalAbsen = rekap?.total || 1;
  const persentase = Math.round((totalHadir / totalAbsen) * 100);
  const unreadNotif = useMemo(() => notifications.filter(n => !n.is_dibaca).length, [notifications]);
  const alphaCount = rekap?.alpa || 0;

  const streakCount = useMemo(() => {
    if (persentase >= 90) return Math.min(12, totalHadir);
    if (persentase >= 75) return Math.min(5, totalHadir);
    return Math.min(2, totalHadir);
  }, [persentase, totalHadir]);

  const statusConfig = loading
    ? { label: "Memuat...", color: "bg-slate-100 dark:bg-slate-800 text-slate-500", dot: "bg-slate-400" }
    : absensiStatus?.sudah_pulang
    ? { label: "✅ Tugas Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" }
    : absensiStatus?.sudah_masuk
    ? { label: "⚡ Sedang Bekerja", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20", dot: "bg-sky-500 animate-ping" }
    : { label: "⏳ Belum Absen", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", dot: "bg-rose-500" };

  const stats = [
    { label: "Hadir Tepat", value: rekap?.hadir || 0, icon: CheckCircle2, color: "from-emerald-500 to-emerald-700 dark:from-emerald-300 dark:to-emerald-500", bg: "bg-emerald-400/20 dark:bg-emerald-500/30", border: "border-emerald-300 dark:border-emerald-700", vibe: "🔥" },
    { label: "Terlambat", value: rekap?.terlambat || 0, icon: AlertTriangle, color: "from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500", bg: "bg-amber-400/20 dark:bg-amber-500/30", border: "border-amber-300 dark:border-amber-700", vibe: "⏰" },
    { label: "Izin / Cuti", value: (rekap?.izin || 0) + (rekap?.cuti || 0), icon: CalendarRange, color: "from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500", bg: "bg-blue-400/20 dark:bg-blue-500/30", border: "border-blue-300 dark:border-blue-700", vibe: "📋" },
    { label: "Alpha", value: alphaCount, icon: Activity, color: "from-rose-500 to-rose-700 dark:from-rose-300 dark:to-rose-500", bg: "bg-rose-400/20 dark:bg-rose-500/30", border: "border-rose-300 dark:border-rose-700", vibe: "😬" },
  ];

  return (
    <div className={cn(
      "min-h-[calc(100vh-4rem)] relative pb-8 font-sans selection:bg-sky-500/30",
      mounted ? "opacity-100" : "opacity-0"
    )}>
      {/* Background - Gen Z Maximalist Grid + Blobs */}
      <div className="fixed inset-0 z-0 bg-[#f8fafc] dark:bg-[#0f172a]" />

      {/* Heavy grid pattern (Brutalism touch) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: "8px 8px"
        }}
      />

      {/* Abstract neon glow blobs behind content */}
      <div className="fixed top-0 left-0 right-0 h-screen z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ═══ HEADER - BOLD GEN Z ═══ */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-4 pb-4 mt-2 sm:mt-0">
          <div className="flex flex-col items-start w-full sm:w-auto">
            <div className="flex items-center justify-between w-full sm:w-auto mb-4 sm:mb-3">
              {/* Playful greeting badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[14px] bg-sky-300 text-slate-900 border-[2.5px] border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] dark:border-white dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] -rotate-2 hover:rotate-2 transition-transform cursor-default">
                <span className="text-base leading-none drop-shadow-sm">{getGreetingEmoji()}</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none pt-0.5">
                  {greeting()}, {session?.user?.nama?.split(' ')[0] || "Bro"}
                </span>
              </div>

              {/* Mobile-only date pill (moves next to greeting on small screens) */}
              <div className="sm:hidden flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-900 dark:text-slate-900 font-black bg-emerald-400 border-[2px] border-slate-900 dark:border-white rounded-[12px] px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transform rotate-2">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                <span className="pt-0.5">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
              </div>
            </div>

            {/* Chunky title with text stroke effect */}
            <h1 className="text-[40px] sm:text-[48px] font-black tracking-tighter leading-none text-slate-900 dark:text-white drop-shadow-sm">
              Overview<span className="text-sky-500 animate-pulse">.</span>
            </h1>
          </div>

          {/* Desktop-only Date Pill */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-900 dark:text-slate-900 font-black bg-emerald-400 border-[2.5px] border-slate-900 dark:border-white rounded-[16px] px-4 py-2.5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform rotate-1 hover:-rotate-1 transition-transform cursor-default">
            <CalendarDays className="w-4 h-4 shrink-0" strokeWidth={3} />
            <span className="pt-0.5">{new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </header>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── HERO: STATS GRID + STATUS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

              {/* LEFT COLUMN */}
              <div className="lg:col-span-8 space-y-6 sm:space-y-8">

                {/* HERO CARD - Gen Z Maximalist */}
                <div className={cn(
                  "group/card relative overflow-hidden rounded-[32px] border-[3px] p-1",
                  "transition-all duration-300 hover:-translate-y-2",
                  "hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.08)]",
                  "active:scale-[0.98]",
                  "bg-white border-slate-200/80 dark:border-slate-700/80",
                  "hover:border-sky-400 dark:hover:border-sky-500"
                )}>
                  {/* Colorful gradient stripe accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 rounded-t-[32px] z-10" />

                  {/* Decorative blobs - hover reactive */}
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-sky-200/60 to-transparent dark:from-sky-500/10 rounded-full blur-3xl transition-all duration-500 group-hover/card:scale-150 group-hover/card:opacity-80 pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-emerald-200/40 to-transparent dark:from-emerald-500/10 rounded-full blur-3xl transition-all duration-500 group-hover/card:scale-150 group-hover/card:opacity-60 pointer-events-none" />

                  {/* Inner stacked card surface */}
                  <div className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-[28px] p-5 sm:p-7 space-y-5 sm:space-y-6 shadow-inner border border-white/50 dark:border-white/5">

                    {/* Status header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "w-14 h-14 rounded-[18px] flex items-center justify-center text-white shadow-lg transition-all duration-500",
                          "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 dark:from-sky-500 dark:to-blue-700",
                          "group-hover/card:rotate-6 group-hover/card:scale-110"
                        )}>
                          <ScanFace className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Presensi</h2>
                            {absensiStatus?.sudah_pulang ? (
                              <span className="text-sm">✅</span>
                            ) : absensiStatus?.sudah_masuk ? (
                              <span className="text-sm animate-bounce">⚡</span>
                            ) : (
                              <span className="text-sm animate-pulse">⏰</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 dark:text-slate-400 text-sm font-bold">
                            <Clock className="w-3.5 h-3.5 text-sky-500" />
                            <LiveClock />
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">WIB</span>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "inline-flex self-start sm:self-auto items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-2 transition-all duration-300",
                        statusConfig.color,
                        "group-hover/card:scale-105"
                      )}>
                        <span className={cn("w-2 h-2 rounded-full", statusConfig.dot)} />
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Time cards - redesigned chunky */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="group/in group relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2 border-sky-200/50 dark:border-sky-800/50 transition-all duration-300 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-[4px_4px_0px_0px_rgba(14,165,233,0.2)] bg-white dark:bg-slate-800/80">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-900/10 opacity-0 group-hover/in:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="w-8 h-8 rounded-[12px] bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                              <ArrowRight className="w-4 h-4 -rotate-45" />
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Masuk</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 pl-0.5">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                              {absensiStatus?.sudah_masuk ? absensiStatus.absensi_hari_ini?.jam_masuk?.slice(0, 5) : "--:--"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="group/out group relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2 border-rose-200/50 dark:border-rose-800/50 transition-all duration-300 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-[4px_4px_0px_0px_rgba(244,63,94,0.2)] bg-white dark:bg-slate-800/80">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent dark:from-rose-900/10 opacity-0 group-hover/out:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="w-8 h-8 rounded-[12px] bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 border border-rose-200 dark:border-rose-800/50">
                              <ArrowRight className="w-4 h-4 rotate-[135deg]" />
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Pulang</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 pl-0.5">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                              {absensiStatus?.sudah_pulang ? absensiStatus.absensi_hari_ini?.jam_pulang?.slice(0, 5) : "--:--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-11 h-11 rounded-2xl ring-2 ring-white dark:ring-slate-800 shadow-md shrink-0">
                          <AvatarImage src={session?.user?.foto_profile || undefined} alt={session?.user?.nama || "P"} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-white text-sm font-black">
                            {session?.user?.nama?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200">{session?.user?.nama}</span>
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Terverifikasi
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/pegawai/absensi"
                        className="group/btn relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-black rounded-[20px] transition-all duration-300 shadow-[0_4px_0px_0px_rgba(3,105,161,1)] hover:shadow-[0_2px_0px_0px_rgba(3,105,161,1)] hover:translate-y-[2px] active:scale-95 active:shadow-none active:translate-y-[4px] overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10 flex items-center gap-2">
                          Absen Sekarang
                          <ArrowRight className="w-4 h-4 transition-all group-hover/btn:translate-x-1 group-hover/btn:-rotate-12" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ── STATS ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-sky-500" />
                      Bulan Ini
                    </h2>
                    <div className="flex items-center gap-3">
                      {streakCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border-2 border-orange-500/20">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          {streakCount} Hari Beruntun
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{totalAbsen} Hari Kerja</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                      <StatCard key={s.label} {...s} delay={i * 60} />
                    ))}
                  </div>
                </div>

                {/* ── QUICK LINKS ── */}
                <div className="hidden sm:block relative overflow-hidden rounded-[28px] border-[3px] border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.97] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.08)]">
                  {/* Fun decorative top bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-500" />
                  <div className="flex items-center gap-2 mb-6 mt-2">
                    <span className="text-lg">⚡</span>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Navigasi Fitur</h2>
                    <div className="ml-auto flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ALL_LINKS.map((l, i) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={cn(
                          "group relative overflow-hidden rounded-[20px] border-[2.5px] p-4",
                          "transition-all duration-200",
                          "hover:-translate-y-2 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.08)]",
                          "active:scale-[0.92]",
                          "animate-stagger",
                          "border-slate-200 dark:border-slate-700",
                          "hover:border-sky-400 dark:hover:border-sky-500"
                        )}
                        style={{ animationDelay: `${i * 60 + 240}ms` }}
                      >
                        {/* Hover color wash */}
                        <div className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                          l.bg
                        )} />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn(
                              "w-10 h-10 rounded-[14px] flex items-center justify-center",
                              "transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6",
                              "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700",
                              l.color
                            )}>
                              <l.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">{l.vibe}</span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-0.5 transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
                            {l.label}
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{l.desc}</p>
                        </div>

                        {/* Corner decoration */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-tl-[20px] border-t-[3px] border-l-[3px] border-sky-300 dark:border-sky-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-4 space-y-6 sm:space-y-8">

                {/* PERFORMANCE (Maximalist Gen Z style) */}
                <div className="group relative overflow-hidden rounded-[32px] border-[3px] border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.97] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.08)]">
                  {/* Decorative background mesh */}
                  <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] bg-[radial-gradient(var(--color-slate-400)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

                  {/* Inner colorful container */}
                  <div className={cn(
                    "relative h-full rounded-[26px] p-5 sm:p-6 transition-colors duration-500",
                    persentase >= 80 ? "bg-emerald-50/50 dark:bg-emerald-950/20" : persentase >= 50 ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-rose-50/50 dark:bg-rose-950/20"
                  )}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-[16px] flex items-center justify-center text-white text-xl font-black shadow-sm transform -rotate-3 transition-transform duration-300 group-hover:rotate-6",
                          persentase >= 80 ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : persentase >= 50 ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-rose-400 to-rose-600"
                        )}>
                          {persentase >= 80 ? "A" : persentase >= 50 ? "B" : "C"}
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Performa</h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200 animate-pulse" />
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Live Status</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-full px-3 py-1 shadow-sm border border-slate-200 dark:border-slate-700">
                        <span className="text-sm">{persentase >= 80 ? "🌟" : persentase >= 50 ? "💪" : "⚠️"}</span>
                      </div>
                    </div>

                    {/* Circle Chart */}
                    <div className="flex items-center justify-center py-2 mb-6">
                      <div className="relative group/chart cursor-pointer">
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 rounded-full blur-xl scale-110 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-300" />
                        <div className="transition-transform duration-500 group-hover/chart:scale-110 group-hover/chart:rotate-3 relative z-10">
                          <ProgressRing percentage={persentase} size={144} strokeWidth={10} />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                          <span className={cn(
                            "text-4xl font-black tabular-nums tracking-tighter drop-shadow-sm",
                            persentase >= 80 ? "text-emerald-600 dark:text-emerald-400" : persentase >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            <AnimatedCounter value={persentase} />
                            <span className="text-xl font-bold opacity-50">%</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Pill boxes */}
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3.5 border-2 border-slate-100 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-700">📅</span> Total Hari
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{totalAbsen}</span>
                      </div>

                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3.5 border-2 border-slate-100 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30">✅</span> Hadir
                        </span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{totalHadir}</span>
                      </div>

                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3.5 border-2 border-slate-100 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="p-1 rounded-md bg-rose-100 dark:bg-rose-900/30">❌</span> Alpha
                        </span>
                        <span className={cn("text-sm font-black tabular-nums", alphaCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400")}>
                          {alphaCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOTIFICATIONS - Gen Z */}
                <div className="group/notif relative overflow-hidden rounded-[28px] border-[3px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.97] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.08)]">
                  {/* Decorative header gradient */}
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500" />

                  <div className="relative">
                    {/* Header */}
                    <div className="p-5 border-b-[3px] border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-[14px] flex items-center justify-center border-2 transition-all duration-300",
                          unreadNotif > 0
                            ? "bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        )}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-900 dark:text-white">Notifikasi</h2>
                          {unreadNotif > 0 ? (
                            <p className="text-[10px] font-bold text-sky-500 dark:text-sky-400">{unreadNotif} belum dibaca</p>
                          ) : notifications.length > 0 ? (
                            <p className="text-[10px] font-bold text-emerald-500">Semua terbaca ✅</p>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-400">Tidak ada</p>
                          )}
                        </div>
                      </div>
                      {unreadNotif > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-[12px] bg-gradient-to-br from-sky-500 to-blue-600 text-white text-[10px] font-black shadow-md shadow-sky-300/30">
                          {unreadNotif}
                        </span>
                      )}
                    </div>

                    {/* List */}
                    <div className="min-h-[100px] max-h-[280px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-[20px] flex items-center justify-center mb-4 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-3xl">🔔</span>
                          </div>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200">Semua clear!</p>
                          <p className="text-xs font-bold text-slate-400 mt-1">Nggak ada notifikasi baru, santuy aja.</p>
                        </div>
                      ) : (
                        <div className="divide-y-[3px] divide-slate-100 dark:divide-slate-800/60">
                          {notifications.map((n, i) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(n); }}
                              className={cn(
                                "flex items-start gap-3.5 px-5 py-4 transition-all cursor-pointer group/item",
                                "hover:bg-sky-50/50 dark:hover:bg-sky-900/10 active:bg-sky-100 dark:active:bg-sky-900/20",
                                n.is_dibaca ? "" : "bg-gradient-to-r from-sky-50/50 to-transparent dark:from-sky-900/10",
                                i === 0 && "rounded-t-none"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-[14px] shrink-0 flex items-center justify-center border-[3px] mt-0.5 transition-all duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6",
                                n.is_dibaca
                                  ? "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                  : "bg-white border-sky-200 dark:bg-slate-800 dark:border-sky-700 shadow-sm"
                              )}>
                                {getIconForNotification(n.judul)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn(
                                  "text-xs mb-0.5 leading-snug",
                                  n.is_dibaca ? "text-slate-600 dark:text-slate-300 font-bold" : "text-slate-900 dark:text-slate-100 font-black"
                                )}>
                                  {n.judul}
                                </p>
                                <p className="text-[11px] text-slate-400 font-bold line-clamp-1 mb-0.5">{n.pesan}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-400/80 font-black">{formatDate(n.created_at, "datetime")}</span>
                                  {!n.is_dibaca && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-pulse" />}
                                </div>
                              </div>
                              {n.link && (
                                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-1.5 opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-0.5" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <Link
                      href="/pegawai/notifikasi"
                      className={cn(
                        "flex items-center justify-between w-full p-4 border-t-[3px] border-slate-100 dark:border-slate-800",
                        "text-xs font-black text-center transition-all",
                        "text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300",
                        "bg-gradient-to-r from-sky-50/50 to-transparent dark:from-sky-900/10 hover:from-sky-100/50 dark:hover:from-sky-900/30"
                      )}
                    >
                      <span>Lihat Semua Notifikasi</span>
                      <span className="text-base opacity-50 group-hover/notif:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
      <div className="lg:col-span-8 space-y-6 sm:space-y-8">
        <Shimmer className="h-[380px] sm:h-[320px]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-[130px]" />)}
        </div>
        <Shimmer className="h-[200px]" />
      </div>
      <div className="lg:col-span-4 space-y-6 sm:space-y-8">
        <Shimmer className="h-[360px]" />
        <Shimmer className="h-[340px]" />
        <Shimmer className="h-[130px]" />
      </div>
    </div>
  );
}
