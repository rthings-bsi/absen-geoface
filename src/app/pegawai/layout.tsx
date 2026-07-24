"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, Clock, ClipboardList, User, Camera, Bell, BellDot, Sun, Moon, LogOut, CalendarDays, AlertTriangle, CheckCircle2, Info, Home, History, FileSignature, CircleUserRound, ScanFace } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notifikasi } from "@/types";

const navItems = [
  { href: "/pegawai/dashboard", label: "Dashboard", icon: LayoutDashboard, activeIcon: Home },
  { href: "/pegawai/absensi", label: "Absensi", icon: Camera, activeIcon: ScanFace },
  { href: "/pegawai/riwayat", label: "Riwayat", icon: Clock, activeIcon: History },
  { href: "/pegawai/pengajuan", label: "Pengajuan", icon: ClipboardList, activeIcon: FileSignature },
  { href: "/pegawai/profil", label: "Profil", icon: User, activeIcon: CircleUserRound },
];

// ─── Komponen Jam Digital Terpisah ───
// Ini mencegah re-render pada seluruh layout tiap detik
function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update setiap 1 menit (bukan 1 detik) karena kita cuma nampilin HH:mm
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="text-xs text-sky-400 dark:text-sky-500 font-mono">
      {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
    </span>
  );
}

function MobileClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update setiap 1 menit (60000ms) bukan 1 detik, buat hemat performa re-render
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <p className="text-[10px] text-sky-500 dark:text-sky-400 font-mono">
      {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
    </p>
  );
}

export default function PegawaiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMarking, setNotifMarking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const sessionReady = useRef(false);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_dibaca).length, [notifications]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/notifikasi?limit=5")
      .then(res => res.ok ? res.json() : [])
      .then(data => setNotifications(data ?? []))
      .catch(() => {});
  }, [sessionStatus]);

  // Reset state ketika session baru setelah login/logout
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (!sessionReady.current) {
        sessionReady.current = true;
      }
      setMenuOpen(false);
      setNotifOpen(false);
    }
    if (sessionStatus === "unauthenticated") {
      sessionReady.current = false;
    }
  }, [sessionStatus]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      const target = e.target as Node;
      const clickedDesktopNotif = desktopNotifRef.current?.contains(target);
      const clickedMobileNotif = mobileNotifRef.current?.contains(target);
      if (!clickedDesktopNotif && !clickedMobileNotif) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Tutup dropdown kalau pindah halaman
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const markAllAsRead = async () => {
    setNotifMarking(true);
    try {
      const res = await fetch("/api/notifikasi/baca-semua", { method: "POST" });
      if (res.ok) setNotifications(prev => prev.map(n => ({ ...n, is_dibaca: true })));
    } catch (e) {} finally { setNotifMarking(false); }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifikasi/${id}`, { method: "PATCH" });
      if (res.ok) setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_dibaca: true } : n)));
    } catch (e) {}
  };

  const handleNotifClick = (n: Notifikasi) => {
    if (!n.is_dibaca) markAsRead(n.id);
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  const getIconForNotif = (judul: string) => {
    const text = judul.toLowerCase();
    if (text.includes("pengajuan") || text.includes("cuti") || text.includes("izin")) return <CalendarDays className="w-4 h-4 text-orange-500" />;
    if (text.includes("ditolak") || text.includes("gagal") || text.includes("peringatan")) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (text.includes("disetujui") || text.includes("berhasil") || text.includes("hadir")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Info className="w-4 h-4 text-sky-500" />;
  };

  const renderNavIcon = useCallback((label: string, isActive: boolean) => {
    const item = navItems.find(i => i.label === label);
    if (!item) return null;
    const Icon = isActive ? item.activeIcon : item.icon;
    return (
      <div className={cn(
        "relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300",
        isActive ? "scale-110 mb-1" : "group-hover:-translate-y-1"
      )}>
        {isActive && <div className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-full blur-[2px]" />}
        <Icon className={cn("w-5.5 h-5.5 relative z-10 transition-transform duration-300", isActive && "drop-shadow-sm")} />
      </div>
    );
  }, []);

  const currentPage = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/")) || navItems[0];
  const CurrentIcon = currentPage.icon;

  const layoutKey = sessionStatus === "loading" ? "loading" : sessionStatus === "authenticated" ? (session?.user?.id || "auth") : "anon";

  return (
    <div key={layoutKey} className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-950 dark:to-slate-900">
      {/* Floating bg orbs (Animasi pulse dihilangkan biar enteng) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-sky-200/30 dark:bg-sky-800/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-sky-100/40 dark:bg-sky-900/10 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Desktop top navbar - Gen Z */}
      <header className={cn(
        "hidden md:flex sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] saturate-150 border-b-[2.5px] border-slate-200/80 dark:border-slate-700/80 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
          : "bg-white/40 dark:bg-slate-950/40 backdrop-blur-[12px]"
      )}>
        <div className="w-full px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/pegawai/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-[14px] bg-white dark:bg-slate-800 shadow-sm border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 transition-transform group-hover:-rotate-6 group-hover:scale-105">
              <img src="/lambang-karawang.png" alt="Lambang" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-black text-slate-900 dark:text-white">Sistem Absensi</p>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desa Kuta Mekar</p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2" ref={menuRef}>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-1.5 shadow-sm">
              <ClockDisplay />
            </div>

            {/* Notif dropdown */}
            <div className="relative" ref={desktopNotifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifikasi"
                className={cn(
                  "relative w-10 h-10 rounded-[14px] flex items-center justify-center border-2 transition-all duration-200",
                  notifOpen
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-600"
                    : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-300 dark:hover:border-sky-600"
                )}
              >
                {unreadCount > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-[8px] font-black text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Panel */}
              <div className={cn(
                "absolute right-0 top-full mt-2 w-80 origin-top-right z-50 transition-all duration-200",
                notifOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              )}>
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-[20px] rounded-[24px] border-[2.5px] border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.06)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Notifikasi</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} disabled={notifMarking} className="text-[10px] font-black text-sky-600 hover:text-sky-700 disabled:opacity-50 uppercase tracking-wider">
                        {notifMarking ? "..." : "Baca semua"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y-2 divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">🔔</div>
                        <p className="text-xs font-bold text-slate-500">Belum ada notifikasi</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button key={n.id} onClick={() => handleNotifClick(n)}
                          className={cn("w-full flex items-start gap-3 px-4 py-3 text-left transition-colors", n.is_dibaca ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "bg-sky-50/50 dark:bg-sky-900/10", n.link ? "cursor-pointer" : "")}>
                          <div className="w-9 h-9 rounded-[14px] bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">{getIconForNotif(n.judul)}</div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-xs leading-tight truncate", n.is_dibaca ? "text-slate-600 dark:text-slate-300 font-bold" : "text-slate-900 dark:text-slate-100 font-black")}>{n.judul}</p>
                            <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{n.pesan}</p>
                            <p className="text-[9px] text-sky-500 font-bold mt-0.5">{formatDate(n.created_at, "time")}</p>
                          </div>
                          {!n.is_dibaca && <span className="w-2 h-2 rounded-full bg-sky-500 mt-2.5 shrink-0 animate-pulse" />}
                        </button>
                      ))
                    )}
                  </div>
                  <Link href="/pegawai/notifikasi" onClick={() => setNotifOpen(false)} className="block text-center text-xs font-black text-sky-600 dark:text-sky-400 py-3 border-t-2 border-slate-100 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors uppercase tracking-wider">
                    Lihat semua →
                  </Link>
                </div>
              </div>
            </div>

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-300 dark:hover:border-slate-600 transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Avatar trigger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-all duration-200 overflow-hidden border-2",
                menuOpen ? "border-sky-500 dark:border-sky-400 bg-sky-50 dark:bg-sky-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              )}>
              <Avatar className="w-7 h-7 rounded-[10px]">
                <AvatarImage src={session?.user?.foto_profile || undefined} alt={session?.user?.nama || "P"} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-white text-[9px] font-black">{session?.user?.nama?.charAt(0) || "P"}</AvatarFallback>
              </Avatar>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute top-full right-4 mt-2 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-[20px] rounded-[20px] border-[2.5px] border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.06)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.06)] py-2 overflow-hidden animate-[fadeSlideDown_0.2s_ease-out]">
                <div className="px-4 py-2.5 border-b-2 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[14px] bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white text-xs font-black">{session?.user?.nama?.charAt(0) || "P"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">{session?.user?.nama}</p>
                      <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pegawai</p>
                    </div>
                  </div>
                </div>
                <Link href={currentPage.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-900/30 border-l-[3px] border-sky-500 dark:border-sky-400 mx-2 rounded-lg my-1 transition-all">
                  <CurrentIcon className="w-4 h-4" /> {currentPage.label}
                </Link>
                <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all border-l-[3px] border-transparent hover:border-rose-300 dark:hover:border-rose-700 mx-auto px-4">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile header - Gen Z */}
      <header className={cn(
        "md:hidden sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] saturate-150 border-b-[2.5px] border-slate-200/80 dark:border-slate-700/80"
          : "bg-white/40 dark:bg-slate-950/40 backdrop-blur-[12px]"
      )}>
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/pegawai/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-1">
              <img src="/lambang-karawang.png" alt="Lambang" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-black text-slate-900 dark:text-white">{session?.user?.nama?.split(" ")[0]}</p>
              <p className="text-[8px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5" ref={mobileNotifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifikasi"
              className={cn(
                "relative w-9 h-9 rounded-[12px] flex items-center justify-center border-2 transition-all",
                notifOpen ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-600" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/20"
              )}>
              {unreadCount > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[7px] font-black text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-9 h-9 rounded-[12px] flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Mobile Notif Panel */}
        <div className={cn("fixed left-3 right-3 top-14 z-50 origin-top transition-all duration-200", notifOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none")}>
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-[20px] rounded-[20px] border-[2.5px] border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.06)] overflow-hidden max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-100 dark:border-slate-800">
              <p className="text-sm font-black text-slate-900 dark:text-white">Notifikasi</p>
              {unreadCount > 0 && <button onClick={markAllAsRead} disabled={notifMarking} className="text-[10px] font-black text-sky-600 disabled:opacity-50 uppercase">{notifMarking ? "..." : "Baca semua"}</button>}
            </div>
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">🔔</div>
                <p className="text-xs font-bold text-slate-500">Belum ada notifikasi</p>
              </div>
            ) : notifications.map((n) => (
              <button key={n.id} onClick={() => handleNotifClick(n)} className={cn("w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0", n.is_dibaca ? "" : "bg-sky-50/40 dark:bg-sky-900/10", n.link ? "cursor-pointer" : "")}>
                <div className="w-9 h-9 rounded-[14px] bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">{getIconForNotif(n.judul)}</div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs leading-tight truncate", n.is_dibaca ? "text-slate-600 font-bold" : "text-slate-900 font-black")}>{n.judul}</p>
                  <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{n.pesan}</p>
                  <p className="text-[9px] text-sky-500 font-bold mt-0.5">{formatDate(n.created_at, "time")}</p>
                </div>
                {!n.is_dibaca && <span className="w-2 h-2 rounded-full bg-sky-500 mt-2.5 shrink-0 animate-pulse" />}
              </button>
            ))}
            <Link href="/pegawai/notifikasi" onClick={() => setNotifOpen(false)} className="block text-center text-xs font-black text-sky-600 py-3 border-t-2 border-slate-100 dark:border-slate-800 uppercase tracking-wider">
              Lihat semua →
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-20 md:pb-0 page-reveal relative z-10">{children}</main>

      {/* Footer - Gen Z */}
      <footer className="hidden md:block relative z-10 border-t-[2.5px] border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[12px]">
        <div className="w-full px-5 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>&copy; {new Date().getFullYear()}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>Desa Kuta Mekar</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>v1.0</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-sky-500 dark:text-sky-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 shadow-sm">
                ⚡ Absensi Digital
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav - Glassmorphism Floating Pill */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none transition-all duration-500",
        mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      )}>
        {/* Soft glow di belakang navbar */}
        <div className="absolute inset-0 top-auto bottom-0 h-24 bg-gradient-to-t from-sky-100/50 dark:from-slate-950/80 to-transparent pointer-events-none -z-10" />

        <div className={cn(
          "pointer-events-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] saturate-150",
          "rounded-[32px] border-[2px] border-white/50 dark:border-slate-700/50",
          "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]",
          "max-w-[400px] mx-auto p-1.5"
        )}>
          <div className="flex items-center justify-between">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/pegawai/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center w-full min-w-[64px] h-[58px] rounded-[24px] transition-all duration-300 relative group outline-none",
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 active:scale-95"
                  )}
                >
                  {/* Background pill untuk active state */}
                  {isActive && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 -z-10" />
                  )}

                  {/* Icon animasi */}
                  {isActive ? <item.activeIcon className="w-5.5 h-5.5 text-sky-500 dark:text-sky-400 drop-shadow-sm" /> : <item.icon className="w-5.5 h-5.5 transition-transform duration-300 group-hover:scale-110" />}

                  {/* Dot indicator */}
                  <div className={cn(
                    "absolute bottom-1.5 transition-all duration-300",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}>
                    <div className="w-1 h-1 rounded-full bg-sky-500 dark:bg-sky-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
