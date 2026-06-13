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
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">Pantau kehadiran pegawai</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-14 w-full" />
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
    const color = type === "terlambat" ? "text-amber-600 bg-amber-100 dark:bg-amber-950" : "text-red-600 bg-red-100 dark:bg-red-950";

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${color}`}>
                {icon === Clock ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{filtered.length} pegawai</p>
              </div>
            </div>
            <Badge variant={type === "terlambat" ? "warning" : "destructive"}>
              {filtered.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-sm">Semua pegawai sudah {type === "terlambat" ? "tepat waktu" : "absen"}</p>
              <p className="text-xs mt-1">Tidak ada data untuk ditampilkan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {item.pegawai?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.pegawai}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.nip} {item.jabatan ? `- ${item.jabatan}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {type === "terlambat" && item.durasi_terlambat ? (
                      <p className="text-sm font-medium text-amber-600">
                        {item.durasi_terlambat} menit
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
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
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">Pantau kehadiran pegawai</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
          <Button variant="outline" size="icon-sm" onClick={fetchData}>
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

      <div className="grid gap-4 md:grid-cols-2">
        {renderList(data.terlambat, "terlambat")}
        {renderList(data.tidak_absen, "tidak_absen")}
      </div>
    </div>
  );
}
