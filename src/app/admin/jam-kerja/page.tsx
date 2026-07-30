"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Clock, Search, Calendar, Timer, FileText, Sun, Moon,
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
        toast.error(errData.error || `Gagal menyimpan (${res.status})`);
        return;
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
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Jam Kerja</h1>
            <p className="text-muted-foreground">Kelola jadwal jam kerja</p>
          </div>
        </div>
        <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
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
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Jam Kerja</h1>
          <p className="text-muted-foreground">Kelola jadwal jam kerja</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Jam Kerja
        </Button>
      </div>

      <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
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
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Nama Jadwal</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Jam Masuk</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Jam Keluar</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Toleransi</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Hari Kerja</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group animate-fade-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-3.5 px-3 font-semibold text-gray-800 dark:text-gray-200">{item.nama}</td>
                        <td className="py-3.5 px-3"><span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-md inline-block px-2 py-1">{item.jam_masuk}</span></td>
                        <td className="py-3.5 px-3"><span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-md inline-block px-2 py-1">{item.jam_keluar}</span></td>
                        <td className="py-3.5 px-3 text-gray-600 dark:text-gray-400">{item.toleransi_terlambat} <span className="text-[10px] text-gray-400">mnt</span></td>
                        <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 capitalize">{item.hari_kerja.replace("-", " - ")}</td>
                        <td className="py-3.5 px-3">
                          <Badge variant={item.aktif ? "success" : "secondary"} className={item.aktif ? "" : "text-gray-500 dark:text-gray-400"}>
                            {item.aktif ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(item)}
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="group p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm text-gray-950 dark:text-white">{item.nama}</span>
                      </div>
                      <Badge variant={item.aktif ? "success" : "secondary"} className="text-[10px]">
                        {item.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Jam Masuk</span>
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{item.jam_masuk}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Jam Keluar</span>
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{item.jam_keluar}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Toleransi</span>
                        <span className="text-gray-700 dark:text-gray-300">{item.toleransi_terlambat} mnt</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Hari Kerja</span>
                        <span className="capitalize text-gray-700 dark:text-gray-300">{item.hari_kerja.replace("-", " - ")}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-100/50 dark:border-gray-800/50">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)} className="text-gray-400">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)} className="text-gray-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{editing ? "Edit Jam Kerja" : "Tambah Jam Kerja"}</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {editing ? "Ubah jadwal jam kerja" : "Masukkan jadwal jam kerja baru"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Jadwal Waktu</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Jadwal</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Reguler Pagi" className="pl-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="jam_masuk">Jam Masuk</Label>
                  <div className="relative">
                    <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="jam_masuk" type="time" value={form.jam_masuk} onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jam_keluar">Jam Keluar</Label>
                  <div className="relative">
                    <Moon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="jam_keluar" type="time" value={form.jam_keluar} onChange={(e) => setForm({ ...form, jam_keluar: e.target.value })} className="pl-9" />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pengaturan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toleransi">Toleransi Terlambat (menit)</Label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="toleransi" type="number" value={form.toleransi_terlambat} onChange={(e) => setForm({ ...form, toleransi_terlambat: parseInt(e.target.value) || 0 })} min={0} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hari_kerja">Hari Kerja</Label>
                  <Select value={form.hari_kerja} onValueChange={(v) => setForm({ ...form, hari_kerja: v })}>
                    <SelectTrigger id="hari_kerja">
                      <SelectValue placeholder="Pilih hari kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="senin-jumat">Senin - Jumat</SelectItem>
                      <SelectItem value="senin-sabtu">Senin - Sabtu</SelectItem>
                      <SelectItem value="senin-kamis">Senin - Kamis</SelectItem>
                      <SelectItem value="setiap-hari">Setiap Hari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="aktif" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                <Label htmlFor="aktif" className="cursor-pointer">Aktif</Label>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea id="keterangan" className="flex min-h-[60px] w-full rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-colors resize-none shadow-sm pl-9" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan (opsional)" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
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
