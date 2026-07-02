"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, Clock, ClipboardList, User, Camera, Bell, BellDot, Sun, Moon, Building2, LogOut } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notifikasi } from "@/types";

const navItems = [
  { href: "/pegawai/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pegawai/absensi", label: "Absensi", icon: Camera },
  { href: "/pegawai/riwayat", label: "Riwayat", icon: Clock },
  { href: "/pegawai/pengajuan", label: "Pengajuan", icon: ClipboardList },
  { href: "/pegawai/profil", label: "Profil", icon: User },
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
  const { data: session, status: sessionStatus } = useSession();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sessionReady = useRef(false);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_dibaca).length, [notifications]);

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

      {/* Desktop top navbar */}
      <header className={cn(
        "hidden md:flex sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-sky-100 dark:border-gray-800"
          : "bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm"
      )}>
        <div className="w-full px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/pegawai/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-200/50 dark:shadow-sky-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-900 dark:text-white leading-tight">Sistem Absensi</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400 leading-tight">Pemerintah Kota Karawang</p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3" ref={menuRef}>
            <ClockDisplay />
            <div className="w-px h-5 bg-sky-200/50 dark:bg-gray-700/50" />

            {/* Notifikasi bell */}
            <Link
              href="/pegawai/notifikasi"
              className={cn(
                "relative p-2 rounded-xl transition-colors",
                pathname === "/pegawai/notifikasi"
                  ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300"
                  : "text-sky-400 dark:text-sky-500 hover:bg-sky-50 dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-300"
              )}
            >
              {unreadCount > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[7px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-gray-800 transition-colors text-sky-400 dark:text-sky-500">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Avatar trigger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-md overflow-hidden",
                menuOpen && "ring-2 ring-sky-300 dark:ring-sky-600 ring-offset-2 dark:ring-offset-gray-900"
              )}
            >
              <Avatar className="w-8 h-8 rounded-full">
                <AvatarImage src={session?.user?.foto_profile || undefined} alt={session?.user?.nama || "P"} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-white text-[11px] font-bold">
                  {session?.user?.nama?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Dropdown — hanya current page + logout */}
            {menuOpen && (
              <div className="absolute top-full right-6 mt-2 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-sky-100 dark:border-gray-800 shadow-xl shadow-sky-200/30 dark:shadow-black/30 py-1.5 overflow-hidden animate-[fadeSlideDown_0.2s_ease-out]">
                {/* User info header */}
                <div className="px-4 py-2.5 border-b border-sky-50 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{session?.user?.nama?.charAt(0) || "P"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-sky-900 dark:text-white truncate max-w-[130px]">{session?.user?.nama}</p>
                      <p className="text-[9px] text-sky-500 dark:text-sky-400 leading-tight">Pegawai</p>
                    </div>
                  </div>
                </div>

                {/* Current page link */}
                <Link
                  href={currentPage.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 border-l-2 border-sky-500 dark:border-sky-400 transition-all"
                >
                  <CurrentIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>{currentPage.label}</span>
                </Link>

                <div className="mx-3 my-1 border-t border-sky-100 dark:border-gray-800" />

                {/* Logout */}
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all duration-150 border-l-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-sky-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/pegawai/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-200/40 dark:shadow-sky-900/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <MobileClockDisplay />
              <p className="text-xs font-semibold text-sky-900 dark:text-white">{session?.user?.nama?.split(" ")[0]}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href="/pegawai/notifikasi"
              className={cn(
                "relative p-2 rounded-xl transition-colors",
                pathname === "/pegawai/notifikasi"
                  ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300"
                  : "text-sky-400 dark:text-sky-500 hover:bg-sky-50 dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-300"
              )}
            >
              {unreadCount > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[7px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-gray-800 transition-colors text-sky-400 dark:text-sky-500">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-20 md:pb-0 page-reveal relative z-10">{children}</main>

      {/* Footer */}
      <footer className="hidden md:block relative z-10 border-t border-sky-100 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="w-full px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-sky-400 dark:text-sky-500">
            <div className="flex items-center gap-1">
              <span>&copy; {new Date().getFullYear()}</span>
              <span className="text-sky-300 dark:text-sky-600">·</span>
              <span>Pemerintah Kota Karawang</span>
              <span className="text-sky-300 dark:text-sky-600">·</span>
              <span>Sistem Absensi v1.0</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Platform absensi digital terintegrasi</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-sky-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative",
                  isActive ? "text-sky-600 dark:text-sky-400" : "text-sky-400 dark:text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
                )}
              >
                <div className={cn("p-1 rounded-lg transition-colors", isActive && "bg-sky-50 dark:bg-sky-900/40")}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-sky-400 to-sky-600 dark:from-sky-500 dark:to-sky-700 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
