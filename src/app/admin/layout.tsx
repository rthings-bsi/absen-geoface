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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-gray-900">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 flex flex-col",
          "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
          "border-r border-gray-100/50 dark:border-gray-800/50",
          "shadow-[0_0_40px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_0_40px_-12px_rgba(0,0,0,0.3)]",
          "transition-all duration-300 ease-out",
          collapsed ? "w-[72px] max-lg:w-[280px]" : "w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "lg:top-3 lg:bottom-3 lg:left-3 lg:rounded-2xl lg:h-[calc(100vh-24px)]"
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

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className={cn("px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2", collapsed ? "lg:hidden" : "")}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                        collapsed ? "lg:justify-center lg:px-2 px-3 py-2.5" : "px-3 py-2.5",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50/40 dark:from-blue-950/50 dark:to-indigo-950/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-700 dark:hover:text-gray-200"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                      )}
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-all duration-200",
                          isActive ? "text-blue-600 dark:text-blue-400" : "",
                          "group-hover:scale-110"
                        )}
                      />
                      <span className={cn(collapsed ? "lg:hidden" : "")}>{item.label}</span>
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
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out",
          collapsed ? "lg:ml-[88px]" : "lg:ml-[296px]"
        )}
      >
        <header className="sticky top-3 z-30 mx-3 mt-3 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-sm shadow-black/5 dark:shadow-black/20 border border-gray-100/50 dark:border-gray-800/50">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400 dark:text-gray-500 font-mono tracking-tight">
                {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
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
        </header>

        <main className="flex-1 p-4 lg:p-6 page-reveal">{children}</main>
      </div>
    </div>
  );
}
