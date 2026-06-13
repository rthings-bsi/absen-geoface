"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GitBranch, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Users, ChevronDownSquare,
} from "lucide-react";
import { toast } from "sonner";

interface StrukturNode {
  id: number;
  nama: string;
  id_parent: number | null;
  children: StrukturNode[];
}

function buildTree(data: StrukturNode[], parentId: number | null = null): StrukturNode[] {
  return data
    .filter((item) => item.id_parent === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(data, item.id),
    }));
}

function TreeNode({
  node,
  onEdit,
  onDelete,
  onAddChild,
  depth = 0,
}: {
  node: StrukturNode;
  onEdit: (n: StrukturNode) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors group"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
          <Users className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{node.nama}</p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={() => onAddChild(node.id)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(node)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(node.id)}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StrukturPage() {
  const [tree, setTree] = useState<StrukturNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StrukturNode | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/struktur");
      const json = await res.json();
      const nodes: StrukturNode[] = Array.isArray(json) ? json : json.data || [];
      setTree(buildTree(nodes));
    } catch {
      toast.error("Gagal memuat data struktur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddRoot = () => {
    setEditing(null);
    setParentId(null);
    setForm({ nama: "" });
    setDialogOpen(true);
  };

  const openAddChild = (pid: number) => {
    setEditing(null);
    setParentId(pid);
    setForm({ nama: "" });
    setDialogOpen(true);
  };

  const openEdit = (node: StrukturNode) => {
    setEditing(node);
    setParentId(node.id_parent);
    setForm({ nama: node.nama });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama) {
      toast.error("Nama unit/bagian wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/struktur?id=${editing.id}` : "/api/struktur";
      const method = editing ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        nama: form.nama,
      };
      if (!editing) {
        body.parent_id = parentId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success(editing ? "Unit berhasil diperbarui" : "Unit berhasil ditambahkan");
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Gagal menyimpan unit");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus unit ini beserta seluruh sub-unitnya?")) return;
    try {
      const res = await fetch(`/api/struktur?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Unit berhasil dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus unit");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Struktur Organisasi</h1>
          <p className="text-muted-foreground">Kelola struktur organisasi perusahaan</p>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
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
          <h1 className="text-2xl font-bold tracking-tight">Struktur Organisasi</h1>
          <p className="text-muted-foreground">Kelola struktur organisasi perusahaan</p>
        </div>
        <Button onClick={openAddRoot}>
          <Plus className="w-4 h-4" />
          Tambah Unit Utama
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Bagan Organisasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GitBranch className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Belum ada struktur organisasi</p>
              <p className="text-xs mt-1">Klik Tambah Unit Utama untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAddChild={openAddChild}
                  depth={0}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Unit" : parentId ? "Tambah Sub-Unit" : "Tambah Unit Utama"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Ubah data unit organisasi" : "Masukkan data unit baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Unit / Bagian</label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Direktur Utama"
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
