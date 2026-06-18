"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Clock, Users, Search, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface MonitoringItem {
  id: number;
  pegawai_id: number;
  pegawai: string;
  nip: string;
  jabatan?: string;
  tanggal: string;
  jam_masuk?: string;
  keterangan?: string;
  durasi_terlambat?: number;
}

interface MonitoringData {
  terlambat: MonitoringItem[];
  tidak_absen: MonitoringItem[];
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData>({ terlambat: [], tidak_absen: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (date) params.set("tanggal", date);
      const res = await fetch(`/api/admin/monitoring?${params}`);
      const json = await res.json();
      setData({
        terlambat: (json.terlambat || []).map((item: Record<string, unknown>) => ({
          id: item.id as number,
          pegawai_id: (item as any).pegawai_id ?? (item as any).id_pegawai,
          pegawai: (item as any).pegawai?.nama || "-",
          nip: (item as any).pegawai?.nip || "",
          jabatan: (item as any).pegawai?.jabatan?.nama || "",
          tanggal: item.tanggal as string,
          jam_masuk: item.jam_masuk as string | undefined,
          durasi_terlambat: item.durasi_terlambat as number | undefined,
        })),
        tidak_absen: (json.tidak_absen || []).map((item: Record<string, unknown>) => ({
          id: item.id as number,
          pegawai_id: (item as any).id,
          pegawai: (item as any).nama || "-",
          nip: (item as any).nip || "",
          jabatan: (item as any).jabatan?.nama || "",
          tanggal: item.tanggal as string,
        })),
      });
    } catch {
      toast.error("Gagal memuat data monitoring");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterList = (list: MonitoringItem[]) =>
    list.filter(
      (item) =>
        item.pegawai?.toLowerCase().includes(search.toLowerCase()) ||
        item.nip?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Monitoring</h1>
          <p className="text-muted-foreground">Pantau kehadiran pegawai secara real-time</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-14 w-full rounded-xl" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const renderList = (items: MonitoringItem[], type: "terlambat" | "tidak_absen") => {
    const filtered = filterList(items);
    const icon = type === "terlambat" ? Clock : AlertTriangle;
    const title = type === "terlambat" ? "Terlambat" : "Tidak Absen";
    const color = type === "terlambat" ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200/50" : "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200/50";

    return (
      <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
        <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${color} shadow-sm`}>
                {icon === Clock ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} pegawai</p>
              </div>
            </div>
            <Badge variant={type === "terlambat" ? "warning" : "destructive"} className="shadow-sm">
              {filtered.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Semua pegawai sudah {type === "terlambat" ? "tepat waktu" : "absen"}</p>
              <p className="text-xs mt-1">Tidak ada data untuk ditampilkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-300 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] animate-fade-slide-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-900 shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {item.pegawai?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.pegawai}</p>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">{item.nip}</span> {item.jabatan ? `• ${item.jabatan}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {type === "terlambat" && item.durasi_terlambat ? (
                      <p className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md inline-block mb-1 border border-amber-100 dark:border-amber-900/50">
                        {item.durasi_terlambat} mnt
                      </p>
                    ) : null}
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex justify-end">
                      {item.jam_masuk || item.tanggal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Monitoring</h1>
          <p className="text-muted-foreground">Pantau kehadiran pegawai secara real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
          <Button variant="outline" size="icon" onClick={fetchData} className="shadow-sm border-gray-200/60 dark:border-gray-700/50 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari pegawai..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {renderList(data.terlambat, "terlambat")}
        {renderList(data.tidak_absen, "tidak_absen")}
      </div>
    </div>
  );
}
