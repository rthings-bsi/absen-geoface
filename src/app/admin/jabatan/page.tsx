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
  Plus, Pencil, Trash2, Briefcase, Search,
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
        throw new Error(errData.error || `Gagal menyimpan (${res.status})`);
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
            <h1 className="text-2xl font-bold tracking-tight">Jabatan</h1>
            <p className="text-muted-foreground">Kelola data jabatan</p>
          </div>
        </div>
        <Card>
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
          <h1 className="text-2xl font-bold tracking-tight">Jabatan</h1>
          <p className="text-muted-foreground">Kelola data jabatan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Jabatan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Deskripsi</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-medium">{item.nama}</td>
                      <td className="py-3 px-2 text-muted-foreground">{item.deskripsi || "-"}</td>
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
            <DialogTitle>{editing ? "Edit Jabatan" : "Tambah Jabatan"}</DialogTitle>
            <DialogDescription>
              {editing ? "Ubah data jabatan" : "Masukkan data jabatan baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Jabatan</label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama jabatan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Deskripsi jabatan (opsional)"
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
