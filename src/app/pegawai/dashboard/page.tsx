"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  CalendarDays,
  Database,
  Touchpad,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Bell,
  ChevronRight,
  User,
  Fingerprint
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import type { AbsensiStatus, RekapAbsensi, Notifikasi } from "@/types";

// ─── Static Data ───────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { href: "/pegawai/absensi", label: "Presensi Harian", icon: Touchpad, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-500" },
  { href: "/pegawai/riwayat", label: "Riwayat Presensi", icon: History, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-500" },
  { href: "/pegawai/pengajuan", label: "Pengajuan Cuti", icon: CalendarDays, bg: "bg-cyan-50 dark:bg-cyan-900/20", color: "text-cyan-500" },
  { href: "/pegawai/profil", label: "Profil Akun", icon: User, bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-500" },
] as const;

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PegawaiDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [absensiStatus, setAbsensiStatus] = useState<AbsensiStatus | null>(null);
  const [rekap, setRekap] = useState<RekapAbsensi | null>(null);

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

        const [statusRes, rekapRes] = await Promise.allSettled([
          fetch("/api/absensi/status").then(safeJson),
          fetch("/api/absensi/rekap-bulanan").then(safeJson),
        ]);

        if (cancelled) return;
        if (statusRes.status === 'fulfilled') setAbsensiStatus(statusRes.value);
        if (rekapRes.status === 'fulfilled') setRekap(rekapRes.value);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const alphaCount = rekap?.alpa || 0;
  const initials = session?.user?.nama?.substring(0, 2).toUpperCase() || "RS";

  // Tanggal Hari Ini
  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); // e.g. Sun, 26 Jul 2026

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative font-['Inter',sans-serif] text-on-surface selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617]">
      {/* ── Desktop Top Nav (Optional/Handled by layout, but we'll adapt to Design.md structure) ── */}
      {/* ── Main Content ── */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-32 md:pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          
          {/* Profile Header */}
          <section className="flex items-center justify-between p-4 md:p-6 bg-transparent">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 rounded-full bg-surface-container-highest dark:bg-slate-800 flex items-center justify-center text-on-surface-variant font-bold text-xl border-2 border-white dark:border-slate-700 shadow-sm">
                <AvatarImage src={session?.user?.foto_profile || undefined} alt={session?.user?.nama || "User"} className="object-cover" />
                <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">{session?.user?.nama || "Loading..."}</h1>
                <p className="text-sm md:text-base text-on-surface-variant">{session?.user?.role === "Admin" ? "Administrator" : "Pegawai Desa"}</p>
              </div>
            </div>
          </section>

          {/* Presensi Card */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Today ({todayFormatted})</p>
                <p className="text-sm font-bold text-on-surface">Jadwal Reguler [08:00 - 16:00]</p>
              </div>
              <ClipboardList className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="p-5 md:p-6 grid grid-cols-2 gap-4 md:gap-6 border-b border-slate-200 dark:border-slate-800">
              {/* Start Time */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-500 dark:text-slate-400 font-bold shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Start Time</p>
                  <div className="flex items-center gap-1.5">
                    {loading ? (
                      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                    ) : (
                      <span className={cn(
                        "text-xl md:text-2xl font-black tabular-nums tracking-tight",
                        absensiStatus?.absensi_hari_ini?.jam_masuk ? "text-[#006c4a] dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {absensiStatus?.absensi_hari_ini?.jam_masuk?.slice(0, 5) || "--:--"}
                      </span>
                    )}
                    {absensiStatus?.absensi_hari_ini?.jam_masuk && <MapPin className="w-4 h-4 text-rose-500" />}
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-500 dark:text-slate-400 font-bold shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">End Time</p>
                  <div className="flex items-center gap-1.5">
                    {loading ? (
                      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                    ) : (
                      <span className={cn(
                        "text-xl md:text-2xl font-black tabular-nums tracking-tight",
                        absensiStatus?.absensi_hari_ini?.jam_pulang ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {absensiStatus?.absensi_hari_ini?.jam_pulang?.slice(0, 5) || "--:--"}
                      </span>
                    )}
                    {absensiStatus?.absensi_hari_ini?.jam_pulang && <MapPin className="w-4 h-4 text-rose-500" />}
                  </div>
                </div>
              </div>
            </div>
            
            <Link href="/pegawai/absensi" className="w-full py-3.5 flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              Buka Presensi Kamera <ChevronRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Quick Access Bento Grid */}
          <section className="flex flex-col gap-5 mt-2">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg md:text-xl font-bold text-on-surface tracking-tight">Favorite Menu</h3>
            </div>
            <div className="grid grid-cols-4 gap-y-6 gap-x-3 md:gap-x-4">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="group flex flex-col items-center text-center gap-2.5">
                  <div className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 group-hover:shadow-md",
                    link.bg, link.color
                  )}>
                    <link.icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] md:text-xs font-semibold text-on-surface-variant leading-tight max-w-[80px]">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Absensi Bulan Ini (KPI Grid) */}
          <section className="flex flex-col gap-5 mt-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg md:text-xl font-bold text-on-surface tracking-tight">Absensi Bulan Ini</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Hadir Tepat */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:border-emerald-200 dark:hover:border-emerald-800">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Hadir Tepat</p>
                  <p className="text-xl md:text-2xl font-black text-on-surface tabular-nums leading-none">
                    {loading ? "..." : rekap?.hadir ?? 0}
                  </p>
                </div>
              </div>

              {/* Terlambat */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:border-blue-200 dark:hover:border-blue-800">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Terlambat</p>
                  <p className="text-xl md:text-2xl font-black text-on-surface tabular-nums leading-none">
                    {loading ? "..." : rekap?.terlambat ?? 0}
                  </p>
                </div>
              </div>

              {/* Izin / Cuti */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:border-cyan-200 dark:hover:border-cyan-800">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-500 shrink-0">
                  <CalendarDays className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Izin / Cuti</p>
                  <p className="text-xl md:text-2xl font-black text-on-surface tabular-nums leading-none">
                    {loading ? "..." : (rekap?.izin || 0) + (rekap?.cuti || 0)}
                  </p>
                </div>
              </div>

              {/* Alpa */}
              <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:border-rose-200 dark:hover:border-rose-800">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Alpa</p>
                  <p className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-500 tabular-nums leading-none">
                    {loading ? "..." : alphaCount}
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* ── Right Column (Optional for Desktop Layout) ── */}
        <div className="hidden lg:flex flex-col gap-6 lg:col-span-4">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center h-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
            <div className="w-20 h-20 rounded-full bg-[#1e1b4b]/5 dark:bg-indigo-900/20 flex items-center justify-center text-[#1e1b4b] dark:text-indigo-400 mb-4">
              <Fingerprint className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Presensi Digital</h3>
            <p className="text-sm text-on-surface-variant max-w-[250px]">
              Gunakan kamera untuk verifikasi wajah dan GPS untuk mencatat lokasi kehadiran Anda secara akurat.
            </p>
            <Link href="/pegawai/absensi" className="mt-6 w-full py-3 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold transition-colors">
              Mulai Presensi
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
