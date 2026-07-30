"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Trash2, Users, UserPlus, Camera,
  Mail, Phone, MapPin, Key, User, Hash, ShieldCheck,
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
  foto_profile?: string | null;
}

export default function PegawaiPage() {
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
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

  const openPhoto = (item: Pegawai) => {
    setEditing(item);
    setPhotoDialogOpen(true);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editing) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("foto", file);
    formData.append("id_pegawai", String(editing.id));

    setSaving(true);
    toast.info("Mengunggah foto...");
    try {
      const res = await fetch("/api/pegawai/upload-foto", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Gagal mengunggah foto");
        return;
      }
      toast.success("Foto profil berhasil diperbarui");
      setPhotoDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah foto");
    } finally {
      setSaving(false);
      // reset file input
      e.target.value = "";
    }
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
        toast.error(errData.error || `Gagal menyimpan (${res.status})`);
        return;
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
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Pegawai</h1>
          <p className="text-muted-foreground">Kelola data pegawai</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="w-4 h-4" />
          Tambah Pegawai
        </Button>
      </div>

      <Card className="overflow-hidden border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="pb-0 border-b border-transparent">
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
                    {filtered.map((item, index) => {
                      const sc = statusConfig[item.status] || statusConfig.nonaktif;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 dark:border-gray-800/50 transition-colors hover:bg-blue-50/20 dark:hover:bg-blue-950/10 group animate-fade-slide-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md">{item.nip}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              {item.foto_profile ? (
                                <img src={item.foto_profile} alt={item.nama} className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-gray-900" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-900">
                                  <span className="text-white text-xs font-bold">{item.nama.charAt(0)}</span>
                                </div>
                              )}
                              <span className="font-semibold text-gray-900 dark:text-white">{item.nama}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 text-xs">{item.email}</td>
                          <td className="py-3.5 px-3">
                            {item.jabatan?.nama ? (
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.jabatan.nama}</span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">Belum ada</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 w-fit px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-700/50">
                              <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r", sc.gradient)} />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{sc.label}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openPhoto(item)}
                                className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
                                title="Update Foto"
                              >
                                <Camera className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(item)}
                                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
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

              <div className="md:hidden space-y-3">
                {filtered.map((item) => {
                  const sc = statusConfig[item.status] || statusConfig.nonaktif;
                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.foto_profile ? (
                            <img src={item.foto_profile} alt={item.nama} className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 border-2 border-white dark:border-gray-800" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white dark:border-gray-800">
                              <span className="text-white text-sm font-bold">{item.nama.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.nama}</p>
                            <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.nip}</p>
                          </div>
                        </div>
                        <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r flex-shrink-0", sc.gradient)} title={sc.label} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100/50 dark:border-gray-800/50 pt-2.5">
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Email</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate block">{item.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Jabatan</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate block">{item.jabatan?.nama || "-"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100/50 dark:border-gray-800/50">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openPhoto(item)}
                          className="text-gray-500 hover:text-emerald-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(item)}
                          className="text-gray-500 hover:text-blue-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-500 hover:text-red-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{editing ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {editing ? "Ubah data pegawai" : "Masukkan data pegawai baru"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Informasi Akun</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="nip" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="NIP" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="pl-9" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="password">
                  Password {editing && <span className="text-gray-400 dark:text-gray-500 font-normal">(kosongkan jika tidak diubah)</span>}
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Biarkan kosong" : "Password"} className="pl-9" />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Data Pribadi</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" className="pl-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="telepon">Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="Nomor telepon" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Select value={form.jabatan_id} onValueChange={(v) => setForm({ ...form, jabatan_id: v })}>
                    <SelectTrigger id="jabatan">
                      <SelectValue placeholder="Pilih Jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jabatanList.map((j) => (
                        <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea id="alamat" className="flex min-h-[80px] w-full rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-colors resize-none shadow-sm pl-9" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat" />
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

      {/* Dialog Upload Foto */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Foto Profil</DialogTitle>
            <DialogDescription>
              {editing && `Unggah foto untuk ${editing.nama}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4 overflow-y-auto max-h-[70vh]">
            {editing?.foto_profile && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-sm flex-shrink-0">
                <img
                  src={editing.foto_profile}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-input rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">Klik untuk memilih</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">JPG, PNG, WebP (max 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleUploadFoto}
                disabled={saving}
              />
            </label>
            {saving && <p className="text-sm text-muted-foreground animate-pulse">Mengunggah...</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
