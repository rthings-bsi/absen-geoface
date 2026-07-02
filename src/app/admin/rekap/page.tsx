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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet, FileText, Search, Calendar,
  ChevronLeft, ChevronRight, Eye, X, Trash2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface RekapItem {
  id: number;
  tanggal: string;
  pegawai: string;
  nip: string;
  jam_masuk: string;
  jam_keluar: string;
  status: string;
  keterangan?: string;
  foto_masuk?: string | null;
  foto_pulang?: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RekapPage() {
  const [data, setData] = useState<RekapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [photoModal, setPhotoModal] = useState<{ src: string; label: string } | null>(null);
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{ url: string; date: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: number; label: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (date) params.set("tanggal", date);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/rekap?${params}`);
      const json = await res.json();

      const items = Array.isArray(json) ? json : json.data || json.rekap || [];
      setData(items.map((item: Record<string, unknown>) => ({
        id: item.id as number,
        tanggal: item.tanggal as string,
        pegawai: (item as any).pegawai?.nama || "-",
        nip: (item as any).pegawai?.nip || "",
        jam_masuk: (item as any).jam_masuk || "",
        jam_keluar: (item as any).jam_pulang || "",
        status: (item as any).status_masuk || "",
        keterangan: item.keterangan as string | undefined,
        foto_masuk: (item as any).foto_masuk || null,
        foto_pulang: (item as any).foto_pulang || null,
      })));

      if (json.pagination || json.meta) {
        const p = json.pagination || json.meta;
        setPagination({
          page: p.page || 1,
          limit: p.limit || 20,
          total: p.total || 0,
          totalPages: p.totalPages || p.total_page || 0,
        });
      } else {
        setPagination((prev) => ({ ...prev, total: items.length }));
      }
    } catch {
      toast.error("Gagal memuat data rekap");
    } finally {
      setLoading(false);
    }
  }, [date, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (date) params.set("tanggal", date);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/export/excel?${params}`);
      if (!res.ok) throw new Error("Gagal export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-absensi-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export Excel berhasil");
    } catch {
      toast.error("Gagal export Excel");
    }
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams();
    if (date) params.set("tanggal", date);
    if (search) params.set("search", search);
    
    // Set URL untuk preview di iframe
    const previewUrl = `/api/admin/export/pdf?${params}&download=false`;
    setPdfPreviewModal({ url: previewUrl, date: date || "semua" });
  };

  const handleDownloadPdf = () => {
    if (!pdfPreviewModal) return;
    
    // Gunakan elemen anchor untuk download
    const a = document.createElement("a");
    a.href = pdfPreviewModal.url.replace("&download=false", "&download=true");
    a.download = `rekap-absensi-${pdfPreviewModal.date}.pdf`;
    a.click();
    
    toast.success("Mulai mengunduh PDF");
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await fetch(`/api/admin/rekap?id=${deleteModal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      toast.success("Data absensi berhasil dihapus");
      setDeleteModal(null);
      fetchData();
    } catch {
      toast.error("Gagal menghapus data absensi");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "destructive" | "info" | "pending"; label: string }> = {
      hadir: { variant: "success", label: "Hadir" },
      terlambat: { variant: "warning", label: "Terlambat" },
      izin: { variant: "info", label: "Izin" },
      sakit: { variant: "info", label: "Sakit" },
      alpha: { variant: "destructive", label: "Alpha" },
      cuti: { variant: "pending", label: "Cuti" },
    };
    const s = map[status] || { variant: "pending" as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading && data.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Rekap Absensi</h1>
          <p className="text-muted-foreground">Rekapitulasi data absensi pegawai</p>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

      {/* PDF Preview Modal */}
      <Dialog open={!!pdfPreviewModal} onOpenChange={(open) => !open && setPdfPreviewModal(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <DialogTitle>Preview Rekap Absensi PDF</DialogTitle>
            <Button size="sm" onClick={handleDownloadPdf} className="ml-auto mr-4">
              <FileText className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full bg-muted rounded-md overflow-hidden mt-2">
            {pdfPreviewModal?.url && (
              <iframe 
                src={pdfPreviewModal.url} 
                className="w-full h-full border-0" 
                title="PDF Preview" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Rekap Absensi</h1>
        <p className="text-muted-foreground">Rekapitulasi data absensi pegawai</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center">
              <Input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                className="w-44"
              />
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari pegawai..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Tidak ada data rekap</p>
              <p className="text-xs mt-1">
                {search ? "Coba kata kunci lain" : "Pilih tanggal untuk melihat data"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Tanggal</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">NIP</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Pegawai</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Jam Masuk</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Jam Keluar</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Keterangan</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group animate-fade-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-3.5 px-3 text-gray-600 dark:text-gray-400 font-medium">{item.tanggal}</td>
                        <td className="py-3.5 px-3 font-mono text-xs text-gray-500 dark:text-gray-400">{item.nip}</td>
                        <td className="py-3.5 px-3 font-semibold text-gray-800 dark:text-gray-200">{item.pegawai}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-md py-1 px-2">{item.jam_masuk || "-"}</span>
                            {item.jam_masuk && (
                              <button
                                onClick={() => setPhotoModal({ src: item.foto_masuk || "", label: "Foto Masuk" })}
                                className="p-1 rounded-md hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 text-gray-400 transition-colors"
                                title="Lihat foto masuk"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-md py-1 px-2">{item.jam_keluar || "-"}</span>
                            {item.jam_keluar && (
                              <button
                                onClick={() => setPhotoModal({ src: item.foto_pulang || "", label: "Foto Pulang" })}
                                className="p-1 rounded-md hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 text-gray-400 transition-colors"
                                title="Lihat foto pulang"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">{statusBadge(item.status)}</td>
                        <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 text-xs italic">{item.keterangan || "-"}</td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDeleteModal({ id: item.id, label: `${item.pegawai} (${item.tanggal})` })}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                              title="Hapus data absensi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Total: {pagination.total} data
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      <Dialog open={!!pdfPreviewModal} onOpenChange={(open) => !open && setPdfPreviewModal(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <DialogTitle>Preview Rekap Absensi PDF</DialogTitle>
            <Button size="sm" onClick={handleDownloadPdf} className="ml-auto mr-4">
              <FileText className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full bg-muted rounded-md overflow-hidden mt-2">
            {pdfPreviewModal?.url && (
              <iframe 
                src={pdfPreviewModal.url} 
                className="w-full h-full border-0" 
                title="PDF Preview" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!photoModal} onOpenChange={(open) => !open && setPhotoModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{photoModal?.label}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {photoModal?.src ? (
              <img
                src={photoModal.src}
                alt={photoModal.label}
                className="max-w-full max-h-80 rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <X className="h-8 w-8" />
                <p className="text-sm">Foto tidak tersedia</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteModal} onOpenChange={(open) => !open && setDeleteModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Data Absensi</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-center text-muted-foreground">
              Yakin ingin menghapus data absensi <span className="font-semibold text-foreground">{deleteModal?.label}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}




