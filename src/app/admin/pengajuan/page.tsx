"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Search, CheckCircle, XCircle, Eye,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Pengajuan {
  id: number;
  pegawai: string;
  nip: string;
  jenis: string;
  alasan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  keterangan?: string;
  created_at?: string;
}

const jenisLabel: Record<string, string> = {
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
  dinasluar: "Dinas Luar",
  lembur: "Lembur",
};

const tabs = [
  { key: "Semua", label: "Semua", variant: "default" as const },
  { key: "pending", label: "Pending", variant: "pending" as const },
  { key: "disetujui", label: "Disetujui", variant: "success" as const },
  { key: "ditolak", label: "Ditolak", variant: "destructive" as const },
];

export default function PengajuanPage() {
  const [data, setData] = useState<Pengajuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selected, setSelected] = useState<Pengajuan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pengajuan?status=${activeTab}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Gagal memuat data");
      }
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json.data || json.pengajuan || [];
      setData(raw.map((item: Record<string, unknown>) => ({
        id: item.id as number,
        pegawai: (item as any).pegawai?.nama || "-",
        nip: (item as any).pegawai?.nip || "",
        jenis: item.jenis as string,
        alasan: item.alasan as string,
        tanggal_mulai: item.tanggal_mulai as string,
        tanggal_selesai: item.tanggal_selesai as string,
        status: (item.status as string).toLowerCase(),
        keterangan: item.keterangan as string | undefined,
        created_at: item.created_at as string | undefined,
      })));
    } catch (err) {
      console.error("fetch pengajuan error:", err);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/pengajuan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Gagal approve");
        return;
      }
      toast.success("Pengajuan disetujui");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menyetujui pengajuan");
    }
  };

  const openReject = (id: number) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (rejectId === null) return;
    try {
      const res = await fetch(`/api/pengajuan/${rejectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", alasan_penolakan: rejectReason }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Gagal reject");
        return;
      }
      toast.success("Pengajuan ditolak");
      setRejectOpen(false);
      setRejectId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menolak pengajuan");
    }
  };

  const filtered = data.filter(
    (d) =>
      d.pegawai?.toLowerCase().includes(search.toLowerCase()) ||
      d.jenis?.toLowerCase().includes(search.toLowerCase()) ||
      d.alasan?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "destructive" | "pending" | "info"; label: string }> = {
      pending: { variant: "warning", label: "Pending" },
      disetujui: { variant: "success", label: "Disetujui" },
      ditolak: { variant: "destructive", label: "Ditolak" },
    };
    return <Badge variant={(map[status]?.variant || "pending")}>{map[status]?.label || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Pengajuan</h1>
          <p className="text-muted-foreground">Kelola pengajuan izin, sakit, cuti</p>
        </div>
        <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
          <CardHeader><Skeleton className="h-10 w-64" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Pengajuan</h1>
        <p className="text-muted-foreground">Kelola pengajuan izin, sakit, cuti</p>
      </div>

      <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? "bg-white dark:bg-gray-800 shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengajuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">
                {search ? "Pengajuan tidak ditemukan" : `Tidak ada pengajuan ${activeTab}`}
              </p>
              <p className="text-xs mt-1">
                {search ? "Coba kata kunci lain" : "Belum ada pengajuan dengan status ini"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 hover:border-blue-100 dark:hover:border-blue-800/50 transition-all duration-300 gap-3 group animate-fade-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_2px_10px_-2px_rgba(59,130,246,0.5)] flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-900">
                      <span className="text-white text-xs font-bold">
                        {item.pegawai?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.pegawai}</p>
                        <Badge variant="outline" className="text-[10px] bg-white/60 dark:bg-gray-800/60 font-medium">
                          {jenisLabel[item.jenis?.toLowerCase()] || item.jenis}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.alasan}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                          {item.tanggal_mulai} <span className="mx-0.5">&rarr;</span> {item.tanggal_selesai}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="mr-2">
                      {statusBadge(item.status)}
                    </div>
                    <div className="flex items-center opacity-80 group-hover:opacity-100 transition-opacity bg-gray-50 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-100 dark:border-gray-800">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setSelected(item); setDetailOpen(true); }}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50 rounded-md"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {item.status === "pending" && (
                        <>
                          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApprove(item.id)}
                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-md"
                            title="Setujui"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openReject(item.id)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-100/50 dark:hover:text-red-400 dark:hover:bg-red-900/50 rounded-md"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
            <DialogDescription>Informasi lengkap pengajuan</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pegawai</p>
                  <p className="text-sm font-medium">{selected.pegawai}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NIP</p>
                  <p className="text-sm font-medium">{selected.nip}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jenis</p>
                  <p className="text-sm font-medium">{selected.jenis}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div>{statusBadge(selected.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Mulai</p>
                  <p className="text-sm font-medium">{selected.tanggal_mulai}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Selesai</p>
                  <p className="text-sm font-medium">{selected.tanggal_selesai}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alasan</p>
                <p className="text-sm mt-1">{selected.alasan}</p>
              </div>
              {selected.keterangan && (
                <div>
                  <p className="text-xs text-muted-foreground">Keterangan</p>
                  <p className="text-sm mt-1">{selected.keterangan}</p>
                </div>
              )}
              {selected.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Diajukan Pada</p>
                  <p className="text-sm mt-1">{selected.created_at}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selected?.status === "pending" && (
              <>
                <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => { handleApprove(selected.id); setDetailOpen(false); }}>
                  <CheckCircle className="w-4 h-4" />
                  Setujui
                </Button>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => { openReject(selected.id); setDetailOpen(false); }}>
                  <XCircle className="w-4 h-4" />
                  Tolak
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan</DialogTitle>
            <DialogDescription>Masukkan alasan penolakan</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Alasan Penolakan</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan mengapa pengajuan ditolak..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject}>
              Tolak Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
