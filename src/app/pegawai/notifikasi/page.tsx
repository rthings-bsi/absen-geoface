"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, ArrowLeft, CheckCheck, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Notifikasi } from "@/types";

export default function NotifikasiPage() {
  const { data: session } = useSession();
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

  return (
    <div className="relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-sky-300/20 via-blue-300/15 to-transparent rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-300/20 via-sky-300/15 to-transparent rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-5 md:pt-7 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-[fadeSlideDown_0.5s_ease-out]">
          <div className="flex items-center gap-3">
            <Link href="/pegawai/dashboard" className="p-2 -ml-2 rounded-xl hover:bg-sky-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-sky-500" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Notifikasi</h1>
              <p className="text-xs text-slate-400 font-medium">
                {unreadCount > 0
                  ? `${unreadCount} notifikasi belum dibaca`
                  : "Semua sudah dibaca ✨"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
            >
              {markingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white/60">
                <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md bg-slate-200" />
                  <Skeleton className="h-3 w-1/3 rounded-md bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-sky-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-700">Belum ada notifikasi</h2>
            <p className="text-sm text-slate-400 mt-1">Tenang, semua aman terkendali ✨</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n, idx) => (
              <button
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5",
                  n.is_dibaca
                    ? "bg-white/50 hover:bg-white/80"
                    : "bg-white/90 shadow-sm shadow-sky-100/50 hover:shadow-md hover:bg-white border border-sky-100/50"
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Dot indicator */}
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-2 ring-white relative",
                    n.is_dibaca ? "bg-slate-200" : "bg-blue-600"
                  )}>
                    {!n.is_dibaca && (
                      <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm leading-snug truncate",
                        n.is_dibaca ? "text-slate-600" : "text-slate-900 font-semibold"
                      )}>
                        {n.judul}
                      </p>
                      {!n.is_dibaca && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      )}
                    </div>
                    <p className={cn(
                      "text-xs mt-1 line-clamp-2",
                      n.is_dibaca ? "text-slate-400" : "text-slate-500"
                    )}>
                      {n.pesan}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                      {formatDate(n.created_at, "datetime")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
