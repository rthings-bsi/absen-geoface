"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bell,
  BellDot,
  Sun,
  Moon,
  LogOut,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notifikasi } from "@/types";

const navItems = [
  { href: "/pegawai/dashboard", label: "Beranda", icon: "dashboard" },
  { href: "/pegawai/absensi", label: "Presensi", icon: "fingerprint" },
  { href: "/pegawai/riwayat", label: "Riwayat", icon: "history" },
  { href: "/pegawai/pengajuan", label: "Ajukan", icon: "add_circle" },
  { href: "/pegawai/profil", label: "Profil", icon: "person" },
];

function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="text-xs text-primary dark:text-secondary-fixed font-mono font-bold flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">schedule</span>
      {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
    </span>
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

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setMenuOpen(false);
      setNotifOpen(false);
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
    if (text.includes("pengajuan") || text.includes("cuti") || text.includes("izin")) return <CalendarDays className="w-4 h-4 text-amber-500" />;
    if (text.includes("ditolak") || text.includes("gagal") || text.includes("peringatan")) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (text.includes("disetujui") || text.includes("berhasil") || text.includes("hadir")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  const layoutKey = sessionStatus === "loading" ? "loading" : sessionStatus === "authenticated" ? (session?.user?.id || "auth") : "anon";

  return (
    <div key={layoutKey} className="min-h-screen bg-surface dark:bg-[#0b1120] text-on-surface antialiased relative overflow-x-hidden selection:bg-primary/20">
      {/* Background layer */}
      <div className="absolute inset-0 grid-bg pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-surface to-surface-container/50 pointer-events-none -z-10" />

      {/* Desktop header matching Stitch */}
      <header className={cn(
        "hidden md:flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 transition-all duration-200 border-b",
        scrolled
          ? "bg-white/80 dark:bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-lg border-slate-200 dark:border-slate-800 shadow-sm"
          : "bg-white/60 dark:bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-lg border-slate-200 dark:border-slate-800"
      )}>
        <Link href="/pegawai/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-surface-container-lowest border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 shadow-sm shrink-0">
            <img src="/lambang-karawang.png" alt="Lambang Karawang" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-on-surface">absenin.</p>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Kuta Mekar</p>
          </div>
        </Link>


        <div className="flex items-center gap-4" ref={menuRef}>
          <div className="hidden lg:flex items-center gap-2 bg-surface-container/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <ClockDisplay />
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 hover:bg-surface-container-high dark:bg-slate-800/60 dark:hover:bg-slate-700 transition-colors text-on-surface-variant dark:text-outline-variant border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notif dropdown */}
          <div className="relative" ref={desktopNotifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={cn(
                "p-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 hover:bg-surface-container-high dark:bg-slate-800/60 dark:hover:bg-slate-700 transition-colors text-on-surface-variant dark:text-outline-variant border border-slate-200 dark:border-slate-800 shadow-sm relative",
                notifOpen && "bg-surface-container-high dark:bg-slate-800"
              )}
            >
              {unreadCount > 0 ? <BellDot className="w-4 h-4 text-primary dark:text-primary-fixed-dim" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center ring-2 ring-surface dark:ring-slate-950 shadow-sm animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Panel */}
            <div className={cn(
              "absolute right-0 top-full mt-2 w-80 origin-top-right z-50 transition-all duration-150 glass-card rounded-2xl overflow-hidden",
              notifOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Pemberitahuan</p>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} disabled={notifMarking} className="text-[10px] font-black text-primary hover:text-primary/80 disabled:opacity-50 uppercase tracking-wider">
                    {notifMarking ? "..." : "Baca semua"}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                {notifications.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <Bell className="w-8 h-8 text-outline-variant mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-on-surface-variant font-medium">Belum ada pemberitahuan</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button key={n.id} onClick={() => handleNotifClick(n)}
                      className={cn("w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-high dark:hover:bg-slate-800/50", n.is_dibaca ? "" : "bg-primary/5 dark:bg-primary-fixed/5")}>
                      <div className="w-8 h-8 rounded-lg bg-surface-container dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 mt-0.5">{getIconForNotif(n.judul)}</div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs leading-tight truncate", n.is_dibaca ? "text-on-surface-variant font-medium" : "text-on-surface font-bold")}>{n.judul}</p>
                        <p className="text-[11px] text-on-surface-variant font-medium truncate mt-0.5">{n.pesan}</p>
                        <p className="text-[9px] text-on-surface-variant/80 mt-0.5">{formatDate(n.created_at, "time")}</p>
                      </div>
                      {!n.is_dibaca && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              <Link href="/pegawai/notifikasi" onClick={() => setNotifOpen(false)} className="block text-center text-xs font-bold text-primary dark:text-primary-fixed-dim py-3 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-surface-container-high backdrop-blur-md transition-colors uppercase tracking-wider">
                Lihat Semua
              </Link>
            </div>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all overflow-hidden",
              menuOpen ? "ring-2 ring-primary" : "ring-2 ring-transparent"
            )}>
            <span className="flex h-full w-full items-center justify-center rounded-full bg-primary-container text-primary-fixed-dim font-bold uppercase text-sm">
              <span className="material-symbols-outlined text-xl">
                {navItems.find(item => pathname === item.href || (item.href !== "/pegawai/dashboard" && pathname.startsWith(item.href)))?.icon || "dashboard"}
              </span>
            </span>
          </button>

          {/* Profile Dropdown */}
          {menuOpen && (
            <div className="absolute top-full right-4 mt-2 w-52 bg-surface-container-lowest dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 overflow-hidden z-50">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-on-surface truncate">{session?.user?.nama}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pegawai</p>
              </div>
              <div className="py-1 border-b border-slate-200 dark:border-slate-800">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/pegawai/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 text-xs font-bold transition-colors hover:bg-surface-container-high dark:hover:bg-slate-800",
                        isActive ? "text-primary dark:text-primary-fixed-dim bg-primary/5 dark:bg-primary-fixed/10" : "text-on-surface-variant dark:text-outline-variant"
                      )}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                className="flex items-center gap-3 w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left transition-colors mt-1">
                <span className="material-symbols-outlined text-sm">logout</span> Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile header */}
      <header className={cn(
        "md:hidden sticky top-0 z-40 transition-all duration-200 border-b bg-white/80 dark:bg-slate-900/80 dark:bg-slate-950/85 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-sm"
      )}>
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/pegawai/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container-lowest border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 shadow-sm">
              <img src="/lambang-karawang.png" alt="Lambang Karawang" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-on-surface">{session?.user?.nama?.split(" ")[0]}</p>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Kuta Mekar</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5" ref={mobileNotifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)}
              className={cn(
                "relative w-8 h-8 rounded-lg flex items-center justify-center border transition-all bg-white/60 dark:bg-slate-900/60 text-on-surface-variant dark:text-outline-variant border-slate-200 dark:border-slate-800",
                notifOpen && "bg-surface-container-high dark:bg-slate-850"
              )}>
              {unreadCount > 0 ? <BellDot className="w-4 h-4 text-primary dark:text-primary-fixed-dim" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center ring-2 ring-surface dark:ring-slate-950">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-on-surface-variant dark:text-outline-variant shadow-sm">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Mobile Notif Panel */}
        <div className={cn("fixed left-3 right-3 top-14 z-50 origin-top transition-all duration-150", notifOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none")}>
          <div className="bg-surface-container-lowest dark:bg-slate-950 rounded-xl border border-outline-variant/35 shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
              <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Pemberitahuan</p>
              {unreadCount > 0 && <button onClick={markAllAsRead} disabled={notifMarking} className="text-[10px] font-black text-primary uppercase">{notifMarking ? "..." : "Baca semua"}</button>}
            </div>
            <div className="divide-y divide-outline-variant/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-outline-variant mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-on-surface-variant font-medium">Belum ada pemberitahuan</p>
                </div>
              ) : notifications.map((n) => (
                <button key={n.id} onClick={() => handleNotifClick(n)} className={cn("w-full flex items-start gap-3 px-4 py-3 text-left transition-colors", n.is_dibaca ? "" : "bg-primary/5 dark:bg-primary-fixed/5", n.link ? "cursor-pointer" : "")}>
                  <div className="w-8 h-8 rounded-lg bg-surface-container dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 mt-0.5">{getIconForNotif(n.judul)}</div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs leading-tight truncate", n.is_dibaca ? "text-on-surface-variant font-medium" : "text-on-surface font-bold")}>{n.judul}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium truncate mt-0.5">{n.pesan}</p>
                    <p className="text-[9px] text-on-surface-variant/80 mt-0.5">{formatDate(n.created_at, "time")}</p>
                  </div>
                  {!n.is_dibaca && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />}
                </button>
              ))}
            </div>
            <Link href="/pegawai/notifikasi" onClick={() => setNotifOpen(false)} className="block text-center text-xs font-bold text-primary py-3 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md uppercase tracking-wider">
              Lihat semua →
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-28 md:pb-8 page-reveal relative z-10">{children}</main>

      {/* Desktop Footer */}
      <footer className="hidden md:block relative z-10 border-t border-slate-200 dark:border-slate-800 bg-surface-container-lowest dark:bg-slate-950 py-6 transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/70">
            <span>&copy; {new Date().getFullYear()}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span>Pemerintah Desa Kuta Mekar</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span>v1.0.0</span>
          </div>
          <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest">
            Presensi Digital Karawang
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav matching Stitch */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/80 dark:bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-t-2xl border-t border-slate-200 dark:border-slate-800 shadow-[0px_-8px_32px_rgba(0,0,0,0.06)] transition-all duration-300",
        mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      )}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/pegawai/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-5 py-1.5 transition-all duration-200 group outline-none",
                isActive
                  ? "text-primary dark:text-primary-fixed-dim bg-primary/10 dark:bg-primary-fixed/10"
                  : "text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim"
              )}
            >
              <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                {item.icon}
              </span>
              <span className={cn("text-[10px] font-bold tracking-tight", isActive ? "font-bold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
