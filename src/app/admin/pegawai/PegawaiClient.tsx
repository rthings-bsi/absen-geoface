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
  Search, Plus, Pencil, Trash2, Users, UserPlus, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Pegawai {
  id: number;
  nip: string;
  nama: string;
  email: string;
  jabatan?: { id: number; nama: string };
  jabatan_id?: number;
  status: string;
  telepon?: string;
  alamat?: string;
}

export default function PegawaiPage() {
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pegawai | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nip: "",
    nama: "",
    email: "",
    password: "",
    jabatan_id: "",
    status: "aktif",
    telepon: "",
    alamat: "",
  });
  const [jabatanList, setJabatanList] = useState<{ id: number; nama: string }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pegawai");
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJabatan = useCallback(async () => {
    try {
      const res = await fetch("/api/jabatan");
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      setJabatanList(list);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchJabatan();
  }, [fetchData, fetchJabatan]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nip: "", nama: "", email: "", password: "", jabatan_id: "", status: "aktif", telepon: "", alamat: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: Pegawai) => {
    setEditing(item);
    setForm({
      nip: item.nip || "",
      nama: item.nama || "",
      email: item.email || "",
      password: "",
      jabatan_id: item.jabatan_id ? String(item.jabatan_id) : "",
      status: item.status || "aktif",
      telepon: item.telepon || "",
      alamat: item.alamat || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nip || !form.nama || !form.email) {
      toast.error("NIP, Nama, dan Email wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/pegawai?id=${editing.id}` : "/api/pegawai";
      const method = editing ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        nip: form.nip,
        nama: form.nama,
        email: form.email,
        no_hp: form.telepon || null,
        alamat: form.alamat || null,
        id_jabatan: form.jabatan_id ? Number(form.jabatan_id) : null,
        status: form.status,
      };
      if (editing) {
        body.id = editing.id;
        if (form.password) body.password = form.password;
      } else {
        body.password = form.password || "password";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Gagal menyimpan (${res.status})`);
      }
      toast.success(editing ? "Pegawai berhasil diperbarui" : "Pegawai berhasil ditambahkan");
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pegawai");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus pegawai ini?")) return;
    try {
      const res = await fetch(`/api/pegawai?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Pegawai berhasil dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus pegawai");
    }
  };

  const filtered = data.filter(
    (d) =>
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      d.nip.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig: Record<string, { gradient: string; label: string }> = {
    aktif: { gradient: "from-emerald-400 to-emerald-600", label: "Aktif" },
    nonaktif: { gradient: "from-gray-400 to-gray-500", label: "Nonaktif" },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-9 w-full max-w-sm rounded-xl" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pegawai</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Kelola data pegawai</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="w-4 h-4" />
          Tambah Pegawai
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Cari pegawai..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Users className="w-4 h-4" />
              <span>{filtered.length} pegawai</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400 dark:text-gray-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {search ? "Pegawai tidak ditemukan" : "Belum ada data pegawai"}
              </p>
              <p className="text-xs mt-1">
                {search ? "Coba kata kunci lain" : "Klik Tambah Pegawai untuk menambahkan"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">NIP</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Nama</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Jabatan</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const sc = statusConfig[item.status] || statusConfig.nonaktif;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 dark:border-gray-800/50 transition-colors hover:bg-blue-50/20 dark:hover:bg-blue-950/10 group"
                        >
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{item.nip}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-medium text-gray-900 dark:text-white">{item.nama}</span>
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 text-xs">{item.email}</td>
                          <td className="py-3.5 px-3">
                            {item.jabatan?.nama ? (
                              <span className="text-sm text-gray-600 dark:text-gray-300">{item.jabatan.nama}</span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r", sc.gradient)} />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{sc.label}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(item)}
                                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2">
                {filtered.map((item) => {
                  const sc = statusConfig[item.status] || statusConfig.nonaktif;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900/50 hover:shadow-sm transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold">{item.nama.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.nama}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.nip} · {item.jabatan?.nama || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r", sc.gradient)} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(item)}
                          className="text-gray-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle>
            <DialogDescription>
              {editing ? "Ubah data pegawai" : "Masukkan data pegawai baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">NIP</label>
                <Input
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  placeholder="NIP"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password {editing && <span className="text-gray-400 dark:text-gray-500 font-normal">(kosongkan jika tidak diubah)</span>}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Biarkan kosong" : "Password"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jabatan</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  value={form.jabatan_id}
                  onChange={(e) => setForm({ ...form, jabatan_id: e.target.value })}
                >
                  <option value="">Pilih Jabatan</option>
                  {jabatanList.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</label>
                <Input
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat"
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
