"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard, FileSpreadsheet, Users, Briefcase, Clock, MapPin,
  ClipboardList, Shield, GitBranch, Menu, ChevronLeft, ChevronRight,
  Sun, Moon, Bell, LogOut,
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const menuGroups: { label: string; items: { label: string; href: string; icon: any }[] }[] = [
  { label: "Dashboard", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }] },
  { label: "Absensi", items: [
    { label: "Rekap Absensi", href: "/admin/rekap", icon: FileSpreadsheet },
    { label: "Monitoring", href: "/admin/monitoring", icon: FileSpreadsheet },
  ] },
  { label: "Master Data", items: [
    { label: "Pegawai", href: "/admin/pegawai", icon: Users },
    { label: "Jabatan", href: "/admin/jabatan", icon: Briefcase },
    { label: "Jam Kerja", href: "/admin/jam-kerja", icon: Clock },
    { label: "Lokasi Kantor", href: "/admin/lokasi-kantor", icon: MapPin },
  ] },
  { label: "Pengajuan", items: [{ label: "Pengajuan", href: "/admin/pengajuan", icon: ClipboardList }] },
  { label: "Pengaturan", items: [
    { label: "Role & Permission", href: "/admin/role", icon: Shield },
    { label: "Struktur Organisasi", href: "/admin/struktur", icon: GitBranch },
  ] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      {/* Aesthetic Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 flex flex-col",
          "bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl",
          "border-r border-white/20 dark:border-white/5",
          "shadow-[10px_0_40px_-10px_rgba(0,0,0,0.03)] dark:shadow-[10px_0_40px_-10px_rgba(0,0,0,0.2)]",
          "transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)",
          collapsed ? "w-[72px] max-lg:w-[280px]" : "w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "lg:top-4 lg:bottom-4 lg:left-4 lg:rounded-[24px] lg:h-[calc(100vh-32px)]"
        )}
      >
        <div
          className={cn(
            "flex items-center h-16 px-4 shrink-0",
            collapsed ? "lg:justify-center" : "justify-between"
          )}
        >
          <div className={cn("flex items-center gap-2.5 min-w-0", collapsed && "lg:justify-center")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-200/40 dark:shadow-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <div className={cn("min-w-0", collapsed ? "lg:hidden" : "")}>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin Panel</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">Karawang</p>
            </div>
          </div>
          {!collapsed && (
            <button
              onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden lg:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden lg:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className={cn(
                "px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400/80 dark:text-gray-500/80 mb-2.5",
                collapsed ? "lg:hidden" : ""
              )}>
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300",
                        collapsed ? "lg:justify-center lg:px-2 px-3 py-2.5" : "px-3 py-2.5",
                        isActive
                          ? "bg-white/60 dark:bg-gray-800/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none text-blue-700 dark:text-blue-300 border border-white/40 dark:border-white/5"
                          : "text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      )}
                      <div className={cn(
                        "flex items-center justify-center rounded-lg w-8 h-8 transition-all duration-300",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                      )}>
                        <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={cn(collapsed ? "lg:hidden" : "", "tracking-tight")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn("p-3 shrink-0", collapsed && "lg:text-center")}>
          <div className={cn(
            "flex items-center gap-2.5 rounded-xl p-2",
            collapsed && "lg:justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-sm flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{session?.user?.nama?.charAt(0) || "A"}</span>
            </div>
            <div className={cn("min-w-0 flex-1", collapsed ? "lg:hidden" : "")}>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session?.user?.nama}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className={cn("p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-red-500", collapsed ? "lg:hidden" : "")}
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out z-10",
          collapsed ? "lg:ml-[88px]" : "lg:ml-[296px]"
        )}
      >
        <header className="sticky top-4 z-30 mx-4 mt-4 rounded-2xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/5">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-tight uppercase">Sistem Online</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hidden sm:block">
                {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
              </span>
              <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-800 pl-4">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toast.info("Fitur notifikasi akan segera tersedia")}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 relative"
                  title="Notifikasi"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 page-reveal">{children}</main>
      </div>
    </div>
  );
}
