"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, CheckCheck, Loader2, Info, AlertTriangle, CalendarDays, CheckCircle2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Notifikasi } from "@/types";

export default function NotifikasiPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifikasi?limit=50");
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifikasi/${id}`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_dibaca: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n: Notifikasi) => {
    if (!n.is_dibaca) {
      markAsRead(n.id);
    }

    if (n.link) {
      router.push(n.link);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifikasi/baca-semua", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_dibaca: true })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_dibaca).length;

  const getIconForNotification = (judul: string) => {
    const text = judul.toLowerCase();
    if (text.includes("pengajuan") || text.includes("cuti") || text.includes("izin")) return <CalendarDays className="w-4 h-4 text-orange-500" />;
    if (text.includes("ditolak") || text.includes("gagal") || text.includes("peringatan")) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (text.includes("disetujui") || text.includes("berhasil") || text.includes("hadir")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  const getIconBgForNotification = (judul: string) => {
    const text = judul.toLowerCase();
    if (text.includes("pengajuan") || text.includes("cuti") || text.includes("izin")) return "bg-orange-100 dark:bg-orange-500/20";
    if (text.includes("ditolak") || text.includes("gagal") || text.includes("peringatan")) return "bg-red-100 dark:bg-red-500/20";
    if (text.includes("disetujui") || text.includes("berhasil") || text.includes("hadir")) return "bg-emerald-100 dark:bg-emerald-500/20";
    return "bg-blue-100 dark:bg-blue-500/20";
  };

  return (
    <div className="relative min-h-screen">
      {/* Premium Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-sky-600 to-sky-800 dark:from-sky-900/60 dark:to-sky-950/40 rounded-b-[40px] shadow-lg" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 animate-[fadeSlideDown_0.5s_ease-out]">
          <div className="flex items-center gap-4">
            <Link href="/pegawai/dashboard" className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md border border-white/20 hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Notifikasi</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2.5 w-2.5 relative">
                  {unreadCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>}
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", unreadCount > 0 ? "bg-white" : "bg-emerald-400")}></span>
                </span>
                <p className="text-sm text-sky-100 font-medium">
                  {unreadCount > 0 ? `${unreadCount} pesan belum dibaca` : "Semua pesan telah dibaca ✨"}
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-2 text-xs font-semibold text-sky-900 bg-white hover:bg-sky-50 active:bg-sky-100 px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(255,255,255,0.3)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.4)] active:scale-95 disabled:opacity-70 border border-white/50"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              ) : (
                <CheckCheck className="w-4 h-4 text-sky-600" />
              )}
              Tandai Semua
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 rounded-3xl p-2 shadow-xl shadow-sky-900/5 dark:shadow-black/20 border border-white/50 dark:border-gray-800">
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0 bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2 mt-1">
                    <Skeleton className="h-4 w-3/4 rounded-md bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="h-3 w-1/2 rounded-md bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-24 h-24 rounded-full bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800/50 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Bell className="w-10 h-10 text-sky-400 dark:text-sky-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Kotak Masuk Kosong</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                Anda tidak memiliki notifikasi baru saat ini. Silakan periksa kembali nanti.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n, idx) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "group w-full flex items-start gap-4 p-4 text-left rounded-2xl transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-500/20 active:scale-[0.99]",
                    n.is_dibaca
                      ? "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      : "bg-sky-50/50 dark:bg-sky-900/10 hover:bg-sky-50 dark:hover:bg-sky-900/20 shadow-sm border border-sky-100 dark:border-sky-800/30",
                    n.link ? "cursor-pointer" : ""
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Left Accent Bar for Unread */}
                  {!n.is_dibaca && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-sky-500 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                  )}

                  {/* Icon Avatar */}
                  <div className={cn(
                    "w-12 h-12 rounded-full shrink-0 flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-110",
                    n.is_dibaca
                      ? "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                      : `${getIconBgForNotification(n.judul)} border-transparent`
                  )}>
                    {getIconForNotification(n.judul)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn(
                        "text-[15px] leading-tight truncate pr-2",
                        n.is_dibaca ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-900 dark:text-slate-100 font-bold"
                      )}>
                        {n.judul}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap mt-0.5 shrink-0 flex items-center gap-1">
                        {formatDate(n.created_at, "time")}
                        {n.link && <ChevronRight className="w-3 h-3 ml-1" />}
                      </p>
                    </div>
                    <p className={cn(
                      "text-sm mt-1.5 leading-relaxed",
                      n.is_dibaca ? "text-slate-500 dark:text-slate-400 line-clamp-1" : "text-slate-600 dark:text-slate-300"
                    )}>
                      {n.pesan}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
