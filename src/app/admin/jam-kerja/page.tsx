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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Clock, Search,
} from "lucide-react";
import { toast } from "sonner";

interface JamKerja {
  id: number;
  nama: string;
  jam_masuk: string;
  jam_keluar: string;
  toleransi_terlambat: number;
  hari_kerja: string;
  aktif: boolean;
  keterangan?: string;
}

export default function JamKerjaPage() {
  const [data, setData] = useState<JamKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JamKerja | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    jam_masuk: "08:00",
    jam_keluar: "17:00",
    toleransi_terlambat: 30,
    hari_kerja: "senin-jumat",
    aktif: true,
    keterangan: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jam-kerja");
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json.data || [];
      setData(raw.map((item: any) => ({
        id: item.id,
        nama: item.nama,
        jam_masuk: item.jam_masuk,
        jam_keluar: item.jam_pulang || "-",
        toleransi_terlambat: item.toleransi_terlambat,
        hari_kerja: item.hari_kerja || "senin-jumat",
        aktif: item.aktif ?? true,
        keterangan: item.keterangan || "",
      })));
    } catch {
      toast.error("Gagal memuat data jam kerja");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nama: "",
      jam_masuk: "08:00",
      jam_keluar: "17:00",
      toleransi_terlambat: 30,
      hari_kerja: "senin-jumat",
      aktif: true,
      keterangan: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: JamKerja) => {
    setEditing(item);
    setForm({
      nama: item.nama,
      jam_masuk: item.jam_masuk,
      jam_keluar: item.jam_keluar,
      toleransi_terlambat: item.toleransi_terlambat,
      hari_kerja: item.hari_kerja,
      aktif: item.aktif,
      keterangan: item.keterangan || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.jam_masuk || !form.jam_keluar) {
      toast.error("Nama, jam masuk, dan jam keluar wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/jam-kerja?id=${editing.id}` : "/api/jam-kerja";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Gagal menyimpan (${res.status})`);
      }
      toast.success(editing ? "Jam kerja berhasil diperbarui" : "Jam kerja berhasil ditambahkan");
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan jam kerja");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jam kerja ini?")) return;
    try {
      const res = await fetch(`/api/jam-kerja?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menghapus");
      }
      toast.success("Jam kerja berhasil dihapus");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus jam kerja");
    }
  };

  const filtered = data.filter(
    (d) =>
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      (d.keterangan || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jam Kerja</h1>
            <p className="text-muted-foreground">Kelola jadwal jam kerja</p>
          </div>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jam Kerja</h1>
          <p className="text-muted-foreground">Kelola jadwal jam kerja</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Jam Kerja
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari jam kerja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} jadwal
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">
                {search ? "Jam kerja tidak ditemukan" : "Belum ada data jam kerja"}
              </p>
              <p className="text-xs mt-1">
                {search ? "Coba kata kunci lain" : "Klik Tambah Jam Kerja untuk menambahkan"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Jam Masuk</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Jam Keluar</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Toleransi</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Hari Kerja</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-medium">{item.nama}</td>
                      <td className="py-3 px-2 font-mono text-sm">{item.jam_masuk}</td>
                      <td className="py-3 px-2 font-mono text-sm">{item.jam_keluar}</td>
                      <td className="py-3 px-2">{item.toleransi_terlambat} menit</td>
                      <td className="py-3 px-2 text-muted-foreground capitalize">{item.hari_kerja.replace("-", " - ")}</td>
                      <td className="py-3 px-2">
                        <Badge variant={item.aktif ? "success" : "pending"}>
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Jam Kerja" : "Tambah Jam Kerja"}</DialogTitle>
            <DialogDescription>
              {editing ? "Ubah jadwal jam kerja" : "Masukkan jadwal jam kerja baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Jadwal</label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Reguler Pagi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jam Masuk</label>
                <Input
                  type="time"
                  value={form.jam_masuk}
                  onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jam Keluar</label>
                <Input
                  type="time"
                  value={form.jam_keluar}
                  onChange={(e) => setForm({ ...form, jam_keluar: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Toleransi Terlambat (menit)</label>
                <Input
                  type="number"
                  value={form.toleransi_terlambat}
                  onChange={(e) => setForm({ ...form, toleransi_terlambat: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hari Kerja</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={form.hari_kerja}
                  onChange={(e) => setForm({ ...form, hari_kerja: e.target.value })}
                >
                  <option value="senin-jumat">Senin - Jumat</option>
                  <option value="senin-sabtu">Senin - Sabtu</option>
                  <option value="senin-kamis">Senin - Kamis</option>
                  <option value="setiap-hari">Setiap Hari</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aktif"
                checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="aktif" className="text-sm font-medium">Aktif</label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keterangan</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Keterangan (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
