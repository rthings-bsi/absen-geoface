"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui";
import { GitBranch, ChevronRight, Users, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StrukturOrganisasi } from "@/types";

type TreeNode = {
  id: number;
  id_parent: number | null;
  nama: string;
  children: TreeNode[];
  depth: number;
  [key: string]: any;
};

function buildTree(
  data: StrukturOrganisasi[],
  parentId: number | null = null,
  depth: number = 0
): TreeNode[] {
  return data
    .filter((item) => item.id_parent === parentId)
    .map((item) => ({
      ...item,
      depth,
      children: buildTree(data, item.id, depth + 1),
    }));
}

function TreeNodeItem({
  node,
  defaultExpanded = false,
}: {
  node: TreeNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(
    defaultExpanded || node.children.length === 0
  );
  const hasChildren = node.children.length > 0;

  return (
    <div className="select-none transition-all duration-300">
      <div
        className={cn(
          "flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer mb-1",
          hasChildren
            ? "hover:bg-sky-50/60 active:scale-[0.99]"
            : "hover:bg-slate-50/50"
        )}
        style={{
          // Use smaller indentation steps on mobile and slightly larger on tablet/desktop
          paddingLeft: `calc(${node.depth} * var(--depth-indent, 12px) + 12px)`,
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <div className="w-5 h-5 rounded-lg bg-sky-100/60 flex items-center justify-center transition-colors hover:bg-sky-200/50 shrink-0">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-sky-600 transition-transform duration-300",
                expanded && "rotate-90"
              )}
            />
          </div>
        ) : (
          <div className="w-5 shrink-0 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </div>
        )}

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-bold truncate",
              node.depth === 0 ? "text-sky-950 text-sm" : "text-slate-800"
            )}>
              {node.nama}
            </p>
            {node.pegawai_kepala?.jabatan?.nama && (
              <p className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                {node.pegawai_kepala.jabatan.nama}
              </p>
            )}
          </div>
        </div>

        {node.jumlah_anggota !== undefined && node.jumlah_anggota > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full shrink-0">
            <Users className="h-3 w-3" />
            <span>{node.jumlah_anggota}</span>
          </div>
        )}
      </div>

      {/* Expanded view */}
      {expanded && hasChildren && (
        <div
          className="relative transition-all duration-300"
          style={{
            // Indent the vertical connector line based on depth
            marginLeft: `calc(${node.depth} * var(--depth-indent, 12px) + 22px)`,
          }}
        >
          {/* Vertical connector line */}
          <div className="absolute left-0 top-0 bottom-3 w-px bg-sky-200/50" />

          <div className="space-y-0.5">
            {node.children.map((child) => (
              <TreeNodeItem key={child.id} node={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrukturPage() {
  const [mounted, setMounted] = useState(false);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchStruktur();
  }, []);

  const fetchStruktur = async () => {
    try {
      const res = await fetch("/api/struktur");
      if (!res.ok) throw new Error("Gagal mengambil data struktur");
      const data: StrukturOrganisasi[] = await res.json();
      const treeData = buildTree(data);
      setTree(treeData);
    } catch {
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "p-4 max-w-lg mx-auto space-y-4 pb-28 transition-all duration-500",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}
    style={{
      // Declare CSS variable for responsive indents
      "--depth-indent": "12px",
    } as React.CSSProperties}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/pegawai"
          className="p-2 rounded-xl hover:bg-sky-50 text-sky-500 hover:text-sky-700 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-sky-950">Struktur Organisasi</h1>
          <p className="text-xs text-sky-500">Hierarki jabatan & divisi</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 bg-white/70 backdrop-blur-xl rounded-3xl border border-sky-200/50 p-4 shadow-lg shadow-sky-200/10">
          <Skeleton className="h-10 rounded-xl bg-sky-50/50" />
          <Skeleton className="h-9 rounded-xl bg-sky-50/30 ml-4" />
          <Skeleton className="h-9 rounded-xl bg-sky-50/30 ml-4" />
          <Skeleton className="h-9 rounded-xl bg-sky-50/20 ml-8" />
          <Skeleton className="h-9 rounded-xl bg-sky-50/20 ml-8" />
          <Skeleton className="h-10 rounded-xl bg-sky-50/50" />
        </div>
      ) : tree.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-sky-200/50 shadow-lg shadow-sky-200/10 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-sky-200/50">
            <GitBranch className="h-7 w-7 text-sky-300" />
          </div>
          <p className="text-sm font-semibold text-sky-700">Tidak ada data</p>
          <p className="text-[11px] text-sky-400 mt-1">Struktur organisasi belum dikonfigurasi</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-200/50 shadow-lg shadow-sky-200/10 p-4 overflow-hidden">
          {tree.map((node) => (
            <TreeNodeItem key={node.id} node={node} defaultExpanded />
          ))}
        </div>
      )}
    </div>
  );
}
