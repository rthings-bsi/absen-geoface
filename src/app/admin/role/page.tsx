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
  Shield, Plus, Pencil, Trash2, Save, Search, UserCheck, FileText, Lock,
} from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: number;
  nama: string;
  grup: string;
}

interface Role {
  id: number;
  nama: string;
  deskripsi?: string;
  permissions?: string[];
}

export default function RolePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", deskripsi: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roleRes, permRes] = await Promise.all([
        fetch("/api/role"),
        fetch("/api/permissions"),
      ]);
      const roleJson = await roleRes.json();
      const permJson = await permRes.json();
      setRoles(Array.isArray(roleJson) ? roleJson : roleJson.data || []);
      setPermissions(Array.isArray(permJson) ? permJson : permJson.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data role");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nama: "", deskripsi: "" });
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  const openEdit = (item: Role) => {
    setEditing(item);
    setForm({ nama: item.nama, deskripsi: item.deskripsi || "" });
    setSelectedPermissions(item.permissions || []);
    setDialogOpen(true);
  };

  const togglePermission = (nama: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(nama) ? prev.filter((p) => p !== nama) : [...prev, nama]
    );
  };

  const handleSave = async () => {
    if (!form.nama) {
      toast.error("Nama role wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/role?id=${editing.id}` : "/api/role";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          permissions: selectedPermissions,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || `Gagal menyimpan (${res.status})`);
        return;
      }
      toast.success(editing ? "Role berhasil diperbarui" : "Role berhasil ditambahkan");
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus role ini?")) return;
    try {
      const res = await fetch(`/api/role?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menghapus");
      }
      toast.success("Role berhasil dihapus");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus role");
    }
  };

  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const group = p.grup || "Lainnya";
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  const filtered = roles.filter(
    (r) =>
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      (r.deskripsi || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Role & Permission</h1>
          <p className="text-muted-foreground">Kelola role dan hak akses</p>
        </div>
        <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Role & Permission</h1>
          <p className="text-muted-foreground">Kelola role dan hak akses</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Role
        </Button>
      </div>

      <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} role
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">
                {search ? "Role tidak ditemukan" : "Belum ada data role"}
              </p>
              <p className="text-xs mt-1">
                {search ? "Coba kata kunci lain" : "Klik Tambah Role untuk menambahkan"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Nama Role</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Deskripsi</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">Permission</th>
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
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(item.permissions || []).length === 0 ? (
                              <span className="text-xs text-gray-400 dark:text-gray-600 italic">Tidak ada</span>
                            ) : (
                              (item.permissions || []).slice(0, 4).map((p) => (
                                <Badge key={p} variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">{p}</Badge>
                              ))
                            )}
                            {(item.permissions || []).length > 4 && (
                              <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                +{item.permissions!.length - 4}
                              </Badge>
                            )}
                          </div>
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
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm text-gray-950 dark:text-white">{item.nama}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)} className="text-gray-400">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)} className="text-gray-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.deskripsi || "—"}</p>
                    <div className="flex flex-wrap gap-1">
                      {(item.permissions || []).length === 0 ? (
                        <span className="text-[10px] text-gray-400 italic">Tidak ada permission</span>
                      ) : (
                        (item.permissions || []).slice(0, 6).map((p) => (
                          <Badge key={p} variant="secondary" className="text-[9px] bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                            {p}
                          </Badge>
                        ))
                      )}
                      {(item.permissions || []).length > 6 && (
                        <Badge variant="secondary" className="text-[9px] bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                          +{item.permissions!.length - 6}
                        </Badge>
                      )}
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
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{editing ? "Edit Role" : "Tambah Role"}</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {editing ? "Ubah data role dan permission" : "Masukkan data role baru"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Informasi Role</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role_nama">Nama Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="role_nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama role" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_deskripsi">Deskripsi</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea id="role_deskripsi" className="flex min-h-[60px] w-full rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-colors resize-none shadow-sm pl-9" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi role (opsional)" />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Permissions</h3>
              </div>
              {Object.keys(groupedPermissions).length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada permission tersedia</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([grup, perms]) => (
                    <div key={grup}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {grup}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.nama)}
                                onChange={() => togglePermission(perm.nama)}
                                className="rounded border-input"
                              />
                              <span className="text-sm">{perm.nama}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
