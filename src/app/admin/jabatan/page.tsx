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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Briefcase, Search, FileText, Tag,
} from "lucide-react";
import { toast } from "sonner";

interface Jabatan {
  id: number;
  nama: string;
  deskripsi?: string;
  created_at?: string;
}

export default function JabatanPage() {
  const [data, setData] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Jabatan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", deskripsi: "" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jabatan");
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.data || []);
    } catch {
      toast.error("Gagal memuat data jabatan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nama: "", deskripsi: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: Jabatan) => {
    setEditing(item);
    setForm({ nama: item.nama, deskripsi: item.deskripsi || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama) {
      toast.error("Nama jabatan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/jabatan?id=${editing.id}` : "/api/jabatan";
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
      toast.success(editing ? "Jabatan berhasil diperbarui" : "Jabatan berhasil ditambahkan");
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan jabatan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jabatan ini?")) return;
    try {
      const res = await fetch(`/api/jabatan?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menghapus");
      }
      toast.success("Jabatan berhasil dihapus");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus jabatan");
    }
  };

  const filtered = data.filter(
    (d) =>
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      (d.deskripsi || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Jabatan</h1>
            <p className="text-muted-foreground">Kelola data jabatan</p>
          </div>
        </div>
        <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Jabatan</h1>
          <p className="text-muted-foreground">Kelola data jabatan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Jabatan
        </Button>
      </div>

      <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
              />
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} jabatan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">
                {search ? "Jabatan tidak ditemukan" : "Belum ada data jabatan"}
              </p>
              <p className="text-xs mt-1">
                {search ? "Coba kata kunci lain" : "Klik Tambah Jabatan untuk menambahkan"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Nama Jabatan</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Deskripsi</th>
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
                        <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400">{item.deskripsi || <span className="italic text-gray-300 dark:text-gray-600">Tidak ada deskripsi</span>}</td>
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
                    className="group flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.nama}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{item.deskripsi || "Tidak ada deskripsi"}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
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
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{editing ? "Edit Jabatan" : "Tambah Jabatan"}</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {editing ? "Ubah data jabatan" : "Masukkan data jabatan baru"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Informasi Jabatan</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Jabatan</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama jabatan" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea id="deskripsi" className="flex min-h-[80px] w-full rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-colors resize-none shadow-sm pl-9" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi jabatan (opsional)" />
                  </div>
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
