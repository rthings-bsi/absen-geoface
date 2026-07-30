"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  ClipboardList,
  ChevronRight,
  CalendarDays,
  FileText,
  Stethoscope,
  Home,
  Search,
  X,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Clock,
  Eye,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Loader2,
} from "lucide-react";
import type { Pengajuan } from "@/types";

const STATUS_BADGE: Record<string, { label: string; classes: string; icon: any }> = {
  pending: { label: "Pending", classes: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900", icon: Clock },
  disetujui: { label: "Disetujui", classes: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900", icon: CheckCircle2 },
  ditolak: { label: "Ditolak", classes: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900", icon: Ban },
};

const JENIS_CONFIG: Record<string, { icon: any; label: string }> = {
  izin: { icon: CalendarDays, label: "Izin" },
  sakit: { icon: Stethoscope, label: "Sakit" },
  cuti: { icon: Home, label: "Cuti" },
};

const JENIS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "cuti", label: "Cuti" },
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-4 flex items-center gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className={cn("text-xl font-black tabular-nums leading-none")} style={{ color }}>{value}</p>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FilterDropdown({ open, onClose, jenisFilter, onJenisChange, tanggalMulai, onTanggalMulaiChange, tanggalSelesai, onTanggalSelesaiChange, onReset }: {
  open: boolean; onClose: () => void; jenisFilter: string; onJenisChange: (v: string) => void;
  tanggalMulai: string; onTanggalMulaiChange: (v: string) => void; tanggalSelesai: string; onTanggalSelesaiChange: (v: string) => void;
  onReset: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-12 md:pt-20" onClick={onClose}>
      <div className="fixed inset-0 bg-black/10 dark:bg-black/40" />
      <div ref={ref} onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 space-y-4 transition-all duration-200 w-[280px]",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-slate-500" /><span className="text-sm font-bold text-on-surface">Filter</span></div>
          <button onClick={onReset} className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"><RotateCcw className="w-3 h-3" />Reset</button>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Jenis Pengajuan</p>
          <div className="grid grid-cols-2 gap-1.5">
            {JENIS_OPTIONS.map((opt: any) => {
              const selected = jenisFilter === opt.value;
              return (
                <button key={opt.value} onClick={() => onJenisChange(opt.value)} className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all",
                  selected ? "bg-[#1e1b4b] text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                )}>
                  <span className="flex-1 text-left">{opt.label}</span>{selected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Rentang Tanggal</p>
          <div className="space-y-2">
            <input type="date" value={tanggalMulai} onChange={(e) => onTanggalMulaiChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-on-surface focus:outline-none focus:ring-2 focus:ring-indigo-400/30 [color-scheme:dark]" />
            <input type="date" value={tanggalSelesai} onChange={(e) => onTanggalSelesaiChange(e.target.value)} min={tanggalMulai}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-on-surface focus:outline-none focus:ring-2 focus:ring-indigo-400/30 [color-scheme:dark]" />
          </div>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] text-white text-xs font-bold transition-all active:scale-[0.98]">Terapkan Filter</button>
      </div>
    </div>
  );
}

export default function PengajuanPage() {
  const [mounted, setMounted] = useState(false);
  const [jenisFilter, setJenisFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pengajuan, setPengajuan] = useState<Pengajuan[]>([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchPengajuan(); }, []);
  useEffect(() => { if (searchOpen && searchInputRef.current) searchInputRef.current.focus(); }, [searchOpen]);

  const fetchPengajuan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pengajuan");
      if (!res.ok) throw new Error("Gagal mengambil data");
      setPengajuan(await res.json() ?? []);
    } catch { setPengajuan([]); }
    finally { setLoading(false); }
  };

  const filteredPengajuan = pengajuan.filter((item) => {
    const matchJenis = !jenisFilter || item.jenis?.toLowerCase() === jenisFilter;
    const matchSearch = !searchQuery.trim() || item.alasan?.toLowerCase().includes(searchQuery.toLowerCase());
    let matchTanggal = true;
    if (tanggalMulai) { const tgl = new Date(tanggalMulai); const tglItem = new Date(item.tanggal_mulai); matchTanggal = matchTanggal && tglItem >= tgl; }
    if (tanggalSelesai) { const tgl = new Date(tanggalSelesai); tgl.setHours(23,59,59,999); matchTanggal = matchTanggal && new Date(item.tanggal_mulai) <= tgl; }
    return matchJenis && matchSearch && matchTanggal;
  });

  const activeFilterCount = (jenisFilter ? 1 : 0) + (searchQuery.trim() ? 1 : 0) + (tanggalMulai || tanggalSelesai ? 1 : 0);
  const resetFilters = () => { setJenisFilter(""); setSearchQuery(""); setTanggalMulai(""); setTanggalSelesai(""); };

  const stats = useMemo(() => ({
    total: pengajuan.length,
    pending: pengajuan.filter(i => i.status?.toLowerCase() === "pending").length,
    disetujui: pengajuan.filter(i => i.status?.toLowerCase() === "disetujui").length,
    ditolak: pengajuan.filter(i => i.status?.toLowerCase() === "ditolak").length,
  }), [pengajuan]);

  const toggleFilter = () => setFilterOpen(f => !f);
  const closeFilter = () => setFilterOpen(false);

  return (
    <>
      {filterOpen && (
        <FilterDropdown
          open={filterOpen} onClose={closeFilter}
          jenisFilter={jenisFilter} onJenisChange={setJenisFilter}
          tanggalMulai={tanggalMulai} onTanggalMulaiChange={setTanggalMulai}
          tanggalSelesai={tanggalSelesai} onTanggalSelesaiChange={setTanggalSelesai}
          onReset={resetFilters}
        />
      )}

      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-28 md:pb-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 mb-4 md:mb-6 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/pegawai/dashboard" className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all rounded-full shrink-0">
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-none mb-1">Pengajuan</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cuti, izin, sakit</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden md:flex relative w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" placeholder="Cari pengajuan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-slate-400" /></button>}
            </div>
            <button onClick={() => { toggleFilter(); setSearchOpen(false); }} className={cn("w-9 h-9 md:w-auto md:px-3.5 md:py-2 rounded-xl border text-xs font-semibold flex items-center justify-center md:gap-2 transition-all shrink-0", activeFilterCount > 0 ? "bg-[#1e1b4b] text-white border-transparent" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700")}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Filter</span>
              {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-white/30 text-[9px] font-bold flex items-center justify-center md:ml-1">{activeFilterCount}</span>}
            </button>
            <Link href="/pegawai/pengajuan/baru" className="w-9 h-9 md:w-auto md:px-4 md:py-2 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center md:gap-1.5 transition-all shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Pengajuan Baru</span>
            </Link>
          </div>
        </div>

        {/* Active filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {jenisFilter && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">{jenisFilter}<button onClick={() => setJenisFilter("")}><X className="w-3 h-3" /></button></span>}
            {(tanggalMulai || tanggalSelesai) && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">{tanggalMulai || "..."} - {tanggalSelesai || "..."}<button onClick={() => { setTanggalMulai(""); setTanggalSelesai(""); }}><X className="w-3 h-3" /></button></span>}
            {searchQuery && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">&ldquo;{searchQuery}&rdquo;<button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button></span>}
            <button onClick={resetFilters} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">Hapus semua</button>
          </div>
        )}

        {/* Mobile search */}
        <div className={cn("md:hidden transition-all duration-200 overflow-hidden mb-4", searchOpen ? "max-h-14 opacity-100" : "max-h-0 opacity-0 pointer-events-none")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input ref={searchInputRef} type="text" placeholder="Cari pengajuan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
            {searchQuery && <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 md:mb-6">
          <StatCard label="Total" value={stats.total} icon={Inbox} color="#475569" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="#d97706" />
          <StatCard label="Disetujui" value={stats.disetujui} icon={CheckCircle2} color="#006c4a" />
          <StatCard label="Ditolak" value={stats.ditolak} icon={Ban} color="#e11d48" />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : filteredPengajuan.length === 0 && pengajuan.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-14 text-center">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Tidak ditemukan</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Coba ubah filter atau kata kunci</p>
            <button onClick={resetFilters} className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">Reset filter</button>
          </div>
        ) : filteredPengajuan.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-14 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada pengajuan</p>
            <Link href="/pegawai/pengajuan/baru">
              <button className="mt-4 px-5 py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] text-white text-xs font-bold transition-all"><Plus className="w-4 h-4 inline mr-1" />Buat Pengajuan Baru</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPengajuan.map((item, idx) => {
              const sc = STATUS_BADGE[item.status?.toLowerCase()] ?? { label: item.status, classes: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: FileText };
              const jenis = JENIS_CONFIG[item.jenis?.toLowerCase()] ?? { icon: FileText, label: item.jenis };
              const JenisIcon = jenis.icon;
              const StatusIcon = sc.icon;
              return (
                <Link key={item.id} href={`/pegawai/pengajuan/${item.id}`}>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                        <JenisIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-on-surface capitalize">{jenis.label}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1", sc.classes)}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.alasan}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">{formatDate(item.tanggal_mulai)}{item.tanggal_selesai && ` - ${formatDate(item.tanggal_selesai)}`}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* FAB Mobile */}
        <Link href="/pegawai/pengajuan/baru" className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-[#1e1b4b] hover:bg-[#312e81] text-white shadow-xl flex items-center justify-center transition-all active:scale-90">
          <Plus className="w-6 h-6" />
        </Link>
      </main>
    </>
  );
}
