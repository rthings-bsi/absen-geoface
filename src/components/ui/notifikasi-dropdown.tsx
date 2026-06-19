"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notifikasi } from "@/types";

export default function NotifikasiDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotif = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifikasi?limit=10");
      if (res.ok) {
        const data: Notifikasi[] = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_dibaca).length);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount & every 30s
  useEffect(() => {
    fetchNotif();
    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, [fetchNotif]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleDropdown = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotif();
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifikasi/baca-semua", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_dibaca: true })));
        setUnreadCount(0);
      }
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClickNotif = async (n: Notifikasi) => {
    // Mark as read if unread
    if (!n.is_dibaca) {
      try {
        await fetch(`/api/notifikasi/${n.id}`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_dibaca: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }
    // Navigate if has link
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin}m lalu`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}j lalu`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}h lalu`;

    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 relative"
        title="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full shadow-[0_2px_6px_rgba(239,68,68,0.5)] min-w-[18px] px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[90vw] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Belum ada notifikasi</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tenang, semua aman terkendali ✨</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotif(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex items-start gap-3",
                      !n.is_dibaca && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    {/* Dot */}
                    <div className="mt-1 shrink-0">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          n.is_dibaca ? "bg-gray-300 dark:bg-gray-600" : "bg-blue-500"
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs leading-snug truncate",
                          n.is_dibaca
                            ? "text-gray-600 dark:text-gray-400"
                            : "text-gray-900 dark:text-white font-semibold"
                        )}
                      >
                        {n.judul}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {n.pesan}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatTime(n.created_at)}
                        </span>
                        {n.link && (
                          <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            Buka
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Tandai semua sudah dibaca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
