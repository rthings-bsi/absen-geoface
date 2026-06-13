"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Building2, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Users, ChevronDownSquare, User, Search, X,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────
interface PegawaiKepala {
  nip: string;
  nama: string;
  jabatan: { nama: string } | null;
}

interface StrukturRaw {
  id: number;
  nama: string;
  id_parent: number | null;
  id_pegawai_kepala: number | null;
  level: number;
  urutan: number;
  pegawai_kepala: PegawaiKepala | null;
}

interface StrukturNode extends StrukturRaw {
  children: StrukturNode[];
}

// ─── Tree Builder ─────────────────────────────────────────
function buildTree(data: StrukturRaw[], parentId: number | null = null): StrukturNode[] {
  return data
    .filter((item) => item.id_parent === parentId)
    .sort((a, b) => a.urutan - b.urutan)
    .map((item) => ({
      ...item,
      children: buildTree(data, item.id),
    }));
}

// ─── Org Node Card ────────────────────────────────────────
function OrgNodeCard({
  node,
  onEdit,
  onDelete,
  onAddChild,
  isHighlighted,
}: {
  node: StrukturNode;
  onEdit: (n: StrukturNode) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  isHighlighted: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* ── Node Card ── */}
      <div
        className={`
          relative group w-48 sm:w-56 md:w-64
          rounded-xl border bg-white/70 dark:bg-slate-900/70 backdrop-blur-md
          shadow-md hover:shadow-xl transition-all duration-300
          ${isHighlighted
            ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-400/30"
            : "border-sky-100 dark:border-slate-700"
          }
          hover:scale-[1.02] hover:-translate-y-0.5
          cursor-pointer
        `}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Gradient top bar */}
        <div className="absolute inset-x-0 -top-px h-1 rounded-t-xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

        <div className="p-4">
          {/* Ikon & Nama */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-200/50 dark:shadow-sky-900/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-100 leading-tight break-words">
                {node.nama}
              </p>
              {node.pegawai_kepala && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  </div>
                  <span className="text-xs text-sky-600 dark:text-sky-400 truncate">
                    {node.pegawai_kepala.nama}
                  </span>
                </div>
              )}
              {!node.pegawai_kepala && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1.5">
                  — lowong —
                </p>
              )}
            </div>
          </div>

          {/* Children count badge */}
          {hasChildren && (
            <div className="flex items-center justify-center mt-2">
              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full border border-sky-200/50 dark:border-sky-700/50">
                <Users className="w-3 h-3" />
                {node.children.length} sub-unit
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Tambah Sub-Unit"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            className="p-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Edit Unit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Hapus Unit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Connector line + children ── */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical connector */}
          <div className="w-px h-6 bg-gradient-to-b from-sky-300 to-sky-200 dark:from-sky-600 dark:to-sky-700" />

          {/* Horizontal connector line */}
          <div className="relative w-full">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-sky-300 dark:via-sky-600 to-transparent" />
            {/* Vertical sub-connectors */}
            <div className="flex justify-center gap-4 sm:gap-6 md:gap-8 pt-6">
              {node.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Vertical line from horizontal bar */}
                  <div className="absolute top-0 left-1/2 w-px h-6 -translate-y-6 bg-gradient-to-b from-sky-200 dark:from-sky-700 to-sky-300 dark:to-sky-600" />
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}>
                    <OrgNodeCard
                      node={child}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddChild={onAddChild}
                      isHighlighted={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expand indicator when collapsed */}
      {hasChildren && !expanded && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-sky-400 dark:text-sky-500 animate-pulse">
          <ChevronRight className="w-3 h-3" />
          <span>{node.children.length} sub-unit tersembunyi</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function StrukturPage() {
  const [rawData, setRawData] = useState<StrukturRaw[]>([]);
  const [pegawaiList, setPegawaiList] = useState<{ id: number; nip: string; nama: string; jabatan_nama: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StrukturNode | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", id_pegawai_kepala: "" });
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart");

  // Build tree from raw data
  const tree = useMemo(() => buildTree(rawData), [rawData]);

  // Highlight matching node on search
  const highlightedId = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const found = rawData.find((n) =>
      n.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return found?.id ?? null;
  }, [searchQuery, rawData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [strukRes, pegRes] = await Promise.all([
        fetch("/api/struktur"),
        fetch("/api/struktur/pegawai"),
      ]);
      const strukJson = await strukRes.json();
      const pegJson = await pegRes.json();
      const nodes: StrukturRaw[] = Array.isArray(strukJson) ? strukJson : strukJson.data || [];
      setRawData(nodes);
      setPegawaiList(Array.isArray(pegJson) ? pegJson : []);
    } catch {
      toast.error("Gagal memuat data struktur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CRUD Handlers ──
  const openAddRoot = () => {
    setEditing(null); setParentId(null); setForm({ nama: "", id_pegawai_kepala: "" }); setDialogOpen(true);
  };
  const openAddChild = (pid: number) => {
    setEditing(null); setParentId(pid); setForm({ nama: "", id_pegawai_kepala: "" }); setDialogOpen(true);
  };
  const openEdit = (node: StrukturNode) => {
    setEditing(node); setParentId(node.id_parent);
    setForm({
      nama: node.nama,
      id_pegawai_kepala: node.id_pegawai_kepala ? String(node.id_pegawai_kepala) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) { toast.error("Nama unit wajib diisi"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/struktur?id=${editing.id}` : "/api/struktur";
      const method = editing ? "PUT" : "POST";
      const body: Record<string, unknown> = { nama: form.nama };
      if (!editing) body.parent_id = parentId;
      if (form.id_pegawai_kepala) {
        body.id_pegawai_kepala = parseInt(form.id_pegawai_kepala);
      } else if (editing) {
        body.id_pegawai_kepala = null;
      }

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success(editing ? "Unit berhasil diperbarui" : "Unit berhasil ditambahkan");
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Gagal menyimpan unit");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus unit ini beserta seluruh sub-unitnya?")) return;
    try {
      const res = await fetch(`/api/struktur?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Unit berhasil dihapus");
      fetchData();
    } catch { toast.error("Gagal menghapus unit"); }
  };

  // ── Loading State ──
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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Struktur Organisasi</h1>
          <p className="text-muted-foreground">Kelola struktur organisasi perusahaan</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-0.5">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                viewMode === "chart"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 inline mr-1" />
              Chart
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <ChevronDownSquare className="w-3.5 h-3.5 inline mr-1" />
              List
            </button>
          </div>
          <Button onClick={openAddRoot} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Tambah Unit
          </Button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Cari unit organisasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
        />
      </div>

      {/* ── Chart View ── */}
      {viewMode === "chart" && (
        <div className="overflow-x-auto pb-8">
          <div className="min-w-max">
            {tree.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/50 dark:to-sky-800/50 flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-sky-500" />
                  </div>
                  <p className="text-sm font-medium">Belum ada struktur organisasi</p>
                  <p className="text-xs mt-1">Klik Tambah Unit Utama untuk memulai</p>
                  <Button variant="outline" className="mt-4 gap-1.5" onClick={openAddRoot}>
                    <Plus className="w-4 h-4" /> Tambah Unit Utama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-center pt-8">
                {tree.map((node) => (
                  <OrgNodeCard
                    key={node.id}
                    node={node}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onAddChild={openAddChild}
                    isHighlighted={node.id === highlightedId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChevronDownSquare className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Daftar Unit Organisasi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Belum ada struktur organisasi</p>
                <p className="text-xs mt-1">Klik Tambah Unit Utama untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-1">
                <TreeList
                  nodes={tree}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAddChild={openAddChild}
                  depth={0}
                  highlightedId={highlightedId}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Dialog ── */}
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
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kepala Unit (Opsional)</label>
              <Select
                value={form.id_pegawai_kepala}
                onValueChange={(val) => setForm({ ...form, id_pegawai_kepala: val === "none" ? "" : val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Pegawai..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none" className="text-muted-foreground italic">-- Kosongkan Kepala Unit --</SelectItem>
                  {pegawaiList.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nama} {p.jabatan_nama ? `— ${p.jabatan_nama}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

// ─── Tree List View (mobile-friendly) ────────────────────
function TreeList({
  nodes,
  onEdit,
  onDelete,
  onAddChild,
  depth = 0,
  highlightedId,
}: {
  nodes: StrukturNode[];
  onEdit: (n: StrukturNode) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  depth?: number;
  highlightedId: number | null;
}) {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  const toggle = (id: number) => {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedMap[node.id] ?? true;
        const isHighlighted = node.id === highlightedId;

        return (
          <div key={node.id}>
            <div
              className={`
                flex items-center gap-2 py-2.5 px-3 rounded-xl
                transition-all duration-200 group
                ${isHighlighted
                  ? "bg-sky-50 dark:bg-sky-900/30 ring-1 ring-sky-300 dark:ring-sky-600"
                  : "hover:bg-muted/50"
                }
              `}
              style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
              {/* Expand toggle */}
              <button
                onClick={() => toggle(node.id)}
                className="p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0"
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </button>

              {/* Icon */}
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{node.nama}</p>
                {node.pegawai_kepala && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {node.pegawai_kepala.nama}
                  </p>
                )}
              </div>

              {/* Badge */}
              {hasChildren && (
                <span className="text-[10px] font-medium text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full border border-sky-200/50 dark:border-sky-700/50 flex-shrink-0">
                  {node.children.length}
                </span>
              )}

              {/* Actions */}
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

            {/* Children */}
            {hasChildren && isExpanded && (
              <TreeList
                nodes={node.children}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                depth={depth + 1}
                highlightedId={highlightedId}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
