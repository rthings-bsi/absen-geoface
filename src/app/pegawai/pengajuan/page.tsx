"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";
import { Badge, Skeleton, Button } from "@/components/ui";
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
} from "lucide-react";
import type { Pengajuan } from "@/types";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  disetujui: { label: "Disetujui", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

const JENIS_ICON: Record<string, React.ReactNode> = {
  izin: <CalendarDays className="h-4 w-4" />,
  sakit: <Stethoscope className="h-4 w-4" />,
  cuti: <Home className="h-4 w-4" />,
  lembur: <ClockIcon className="h-4 w-4" />,
};

const JENIS_LABEL: Record<string, string> = {
  izin: "Izin", sakit: "Sakit", cuti: "Cuti", lembur: "Lembur",
};

const JENIS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "izin", label: "Izin", icon: CalendarDays },
  { value: "sakit", label: "Sakit", icon: Stethoscope },
  { value: "cuti", label: "Cuti", icon: Home },
  { value: "lembur", label: "Lembur", icon: ClockIcon },
];

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-sky-200/60 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", bg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={cn("text-xl font-extrabold tabular-nums leading-none", color)}>{value}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────
function FilterDropdown({ open, onClose, jenisFilter, onJenisChange, tanggalMulai, onTanggalMulaiChange, tanggalSelesai, onTanggalSelesaiChange, onReset }: {
  open: boolean; onClose: () => void; jenisFilter: string; onJenisChange: (v: string) => void;
  tanggalMulai: string; onTanggalMulaiChange: (v: string) => void; tanggalSelesai: string; onTanggalSelesaiChange: (v: string) => void;
  onReset: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay注册避免点击按钮本身触发关闭
    setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-12 md:pt-20" onClick={onClose}>
      {/* Click backdrop to close */}
      <div className="fixed inset-0 bg-black/10" />
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-50 bg-white/95 backdrop-blur-xl rounded-2xl border border-sky-200/60 shadow-xl shadow-sky-200/20 p-4 space-y-4 transition-all duration-200 w-[280px]",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-sky-600" /><span className="text-sm font-bold text-sky-900">Filter</span></div>
          <button onClick={onReset} className="text-[10px] font-semibold text-sky-500 hover:text-sky-700 flex items-center gap-1 transition-colors"><RotateCcw className="w-3 h-3" />Reset</button>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-wide mb-2">Jenis Pengajuan</p>
          <div className="grid grid-cols-2 gap-1.5">
            {JENIS_OPTIONS.map((opt: any) => {
              const Icon = opt.icon;
              const selected = jenisFilter === opt.value;
              return (
                <button key={opt.value} onClick={() => onJenisChange(opt.value)} className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-200",
                  selected ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white border-transparent shadow-sm" : "bg-white text-sky-600 border-sky-200/60 hover:bg-sky-50 hover:border-sky-300"
                )}>
                  {Icon && <Icon className="w-3.5 h-3.5" />}<span className="flex-1 text-left">{opt.label}</span>{selected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-wide mb-2">Rentang Tanggal</p>
          <div className="space-y-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400 pointer-events-none" />
              <input type="date" value={tanggalMulai} onChange={(e) => onTanggalMulaiChange(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-sky-50/50 rounded-xl border border-sky-200/50 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400 pointer-events-none" />
              <input type="date" value={tanggalSelesai} onChange={(e) => onTanggalSelesaiChange(e.target.value)} min={tanggalMulai} className="w-full pl-9 pr-3 py-2 text-xs bg-sky-50/50 rounded-xl border border-sky-200/50 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs font-bold shadow-md shadow-sky-200/30 hover:from-sky-600 hover:to-sky-700 transition-all active:scale-[0.98]">Terapkan Filter</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
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

  // ─── Derived ────────────────────────────────────────────────────────────
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
      {/* ═══ FILTER DROPDOWN (single instance) ═══ */}
      {filterOpen && (
        <FilterDropdown
          open={filterOpen}
          onClose={closeFilter}
          jenisFilter={jenisFilter}
          onJenisChange={setJenisFilter}
          tanggalMulai={tanggalMulai}
          onTanggalMulaiChange={setTanggalMulai}
          tanggalSelesai={tanggalSelesai}
          onTanggalSelesaiChange={setTanggalSelesai}
          onReset={resetFilters}
        />
      )}

      {/* ═══ MOBILE VIEW ═══ */}
      <div className="md:hidden p-4 max-w-lg mx-auto space-y-4 pb-24">
        <div className={`flex items-center justify-between mb-2 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2">
            <Link href="/pegawai" className="p-2 rounded-xl hover:bg-sky-50 transition"><ChevronRight className="h-5 w-5 text-sky-500 rotate-180" /></Link>
            <div><h1 className="text-lg font-bold text-sky-950">Pengajuan</h1><p className="text-xs text-sky-500">Cuti, izin, sakit</p></div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setSearchOpen(!searchOpen); closeFilter(); }} className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm", searchOpen ? "bg-gradient-to-r from-sky-500 to-sky-600 border-transparent text-white" : "bg-white/80 border-sky-200/50 text-sky-500 hover:bg-sky-50 hover:border-sky-300")} aria-label="Cari"><Search className="w-4 h-4" /></button>
            <button onClick={() => { toggleFilter(); setSearchOpen(false); }} className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm relative", activeFilterCount > 0 ? "bg-gradient-to-r from-sky-500 to-sky-600 border-transparent text-white" : "bg-white/80 border-sky-200/50 text-sky-500 hover:bg-sky-50 hover:border-sky-300")} aria-label="Filter">
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-white">{activeFilterCount}</span>}
            </button>
            <Link href="/pegawai/pengajuan/baru" className="hidden md:inline-flex"><Button size="sm" className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md shadow-sky-200/50"><Plus className="h-4 w-4 mr-1" />Baru</Button></Link>
          </div>
        </div>
        <div className={cn("transition-all duration-200 overflow-hidden", searchOpen ? "max-h-14 opacity-100" : "max-h-0 opacity-0 pointer-events-none")}>
          <div className="relative pt-1 pb-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 pointer-events-none" />
            <input ref={searchInputRef} type="text" placeholder="Cari pengajuan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-9 py-2.5 text-sm bg-white/80 backdrop-blur-sm rounded-xl border border-sky-200/60 text-sky-900 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
            {searchQuery && <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center hover:bg-sky-200 transition-colors"><X className="w-3 h-3 text-sky-500" /></button>}
          </div>
        </div>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {jenisFilter && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">{JENIS_LABEL[jenisFilter] ?? jenisFilter}<button onClick={() => setJenisFilter("")}><X className="w-3 h-3" /></button></span>}
            {(tanggalMulai || tanggalSelesai) && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">{tanggalMulai || "..."} - {tanggalSelesai || "..."}<button onClick={() => { setTanggalMulai(""); setTanggalSelesai(""); }}><X className="w-3 h-3" /></button></span>}
            {searchQuery && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">&ldquo;{searchQuery}&rdquo;<button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button></span>}
            <button onClick={resetFilters} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">Hapus semua</button>
          </div>
        )}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-sky-100/50" />)}</div>
        ) : filteredPengajuan.length === 0 && pengajuan.length > 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/50 shadow-lg shadow-sky-200/20 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-sky-200/50"><Search className="h-7 w-7 text-sky-300" /></div>
            <p className="text-sm font-semibold text-sky-700">Tidak ditemukan</p><p className="text-[11px] text-sky-400 mt-1">Coba ubah filter atau kata kunci</p>
            <button onClick={resetFilters} className="mt-4 text-[11px] font-semibold text-sky-600 bg-sky-50 px-4 py-2 rounded-full hover:bg-sky-100 transition-colors">Reset filter</button>
          </div>
        ) : filteredPengajuan.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/50 shadow-lg shadow-sky-200/20 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-3"><ClipboardList className="h-6 w-6 text-sky-300" /></div>
            <p className="text-sm font-medium text-sky-700">Belum ada pengajuan</p>
            <Link href="/pegawai/pengajuan/baru"><Button variant="outline" size="sm" className="mt-3 border-sky-200 text-sky-700"><Plus className="h-4 w-4 mr-1" />Buat Pengajuan Baru</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPengajuan.map((item, idx) => {
              const statusConfig = STATUS_BADGE[item.status] ?? { label: item.status, variant: "outline" as const };
              return (
                <Link key={item.id} href={`/pegawai/pengajuan/${item.id}`}>
                  <div className={`bg-white/70 backdrop-blur-sm rounded-xl border border-sky-200/40 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-sky-300/50 hover:scale-[1.01] ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${idx * 80}ms` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sky-500">{JENIS_ICON[item.jenis] ?? <FileText className="h-4 w-4" />}</span>
                          <span className="font-bold text-sm text-sky-900 capitalize">{JENIS_LABEL[item.jenis] ?? item.jenis}</span>
                          <Badge className={statusConfig.variant === "default" ? "bg-sky-100 text-sky-700 border-sky-200" : statusConfig.variant === "destructive" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}>{statusConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-sky-600 mt-1 line-clamp-2">{item.alasan}</p>
                        <p className="text-xs text-sky-400 mt-1">{formatDate(item.tanggal_mulai)}{item.tanggal_selesai && ` - ${formatDate(item.tanggal_selesai)}`}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-sky-300 shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ DESKTOP VIEW ═══ */}
      <div className="hidden md:block max-w-5xl mx-auto px-6 pt-6 pb-10">
        <div className={cn("flex items-center justify-between mb-6 transition-all duration-500", mounted ? "opacity-100" : "opacity-0")}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-sm flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-sky-950 tracking-tight">Pengajuan</h1>
              <span className="text-[10px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full">{pengajuan.length} total</span>
            </div>
            <p className="text-xs text-sky-500 font-medium">Cuti, izin, sakit, lembur</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 pointer-events-none" />
              <input type="text" placeholder="Cari pengajuan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2 text-xs bg-white/90 backdrop-blur-sm rounded-xl border border-sky-200/60 text-sky-900 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-sky-400 hover:text-sky-600" /></button>}
            </div>
            <button onClick={toggleFilter} className={cn("px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm", activeFilterCount > 0 ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white border-transparent" : "bg-white/90 border-sky-200/60 text-sky-600 hover:bg-sky-50 hover:border-sky-300")}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-white/30 text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
            </button>
            <Link href="/pegawai/pengajuan/baru">
              <Button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md shadow-sky-200/40 rounded-xl px-4 py-2 text-xs font-bold"><Plus className="w-4 h-4 mr-1.5" />Pengajuan Baru</Button>
            </Link>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {jenisFilter && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">{JENIS_LABEL[jenisFilter] ?? jenisFilter}<button onClick={() => setJenisFilter("")}><X className="w-3 h-3" /></button></span>}
            {(tanggalMulai || tanggalSelesai) && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">{tanggalMulai || "..."} - {tanggalSelesai || "..."}<button onClick={() => { setTanggalMulai(""); setTanggalSelesai(""); }}><X className="w-3 h-3" /></button></span>}
            {searchQuery && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">&ldquo;{searchQuery}&rdquo;<button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button></span>}
            <button onClick={resetFilters} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">Hapus semua</button>
          </div>
        )}

        <div className={cn("grid grid-cols-4 gap-3 mb-5 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <StatCard label="Total Pengajuan" value={stats.total} icon={Inbox} color="text-sky-700" bg="bg-gradient-to-br from-sky-500 to-sky-600" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="text-amber-700" bg="bg-gradient-to-br from-amber-500 to-orange-600" />
          <StatCard label="Disetujui" value={stats.disetujui} icon={CheckCircle2} color="text-emerald-700" bg="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <StatCard label="Ditolak" value={stats.ditolak} icon={X as any} color="text-rose-700" bg="bg-gradient-to-br from-rose-500 to-pink-600" />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl bg-sky-100/50" />)}</div>
        ) : filteredPengajuan.length === 0 && pengajuan.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-200/50 shadow-lg shadow-sky-200/10 p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-sky-200/50"><Search className="h-8 w-8 text-sky-300" /></div>
            <p className="text-sm font-semibold text-sky-700">Tidak ditemukan</p>
            <p className="text-[11px] text-sky-400 mt-1">Coba ubah filter atau kata kunci pencarian</p>
            <button onClick={resetFilters} className="mt-4 text-[11px] font-semibold text-sky-600 bg-sky-50 px-4 py-2 rounded-full hover:bg-sky-100 transition-colors">Reset filter</button>
          </div>
        ) : filteredPengajuan.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-200/50 shadow-lg shadow-sky-200/10 p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-sky-200/50"><ClipboardList className="h-8 w-8 text-sky-300" /></div>
            <p className="text-sm font-semibold text-sky-700">Belum ada pengajuan</p>
            <p className="text-[11px] text-sky-400 mt-1">Ajukan cuti, izin, atau sakit melalui menu di atas</p>
            <Link href="/pegawai/pengajuan/baru"><Button size="sm" className="mt-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl shadow-md shadow-sky-200/30"><Plus className="w-4 h-4 mr-1.5" />Buat Pengajuan Baru</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPengajuan.map((item, idx) => {
              const statusConfig = STATUS_BADGE[item.status] ?? { label: item.status, variant: "outline" as const };
              return (
                <Link key={item.id} href={`/pegawai/pengajuan/${item.id}`}>
                  <div className={cn("bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-200/40 p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-sky-300/60 hover:-translate-y-0.5", mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")} style={{ transitionDelay: `${idx * 60}ms`, transitionProperty: "all" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">{JENIS_ICON[item.jenis] ?? <FileText className="h-5 w-5" />}</div>
                      <div className="flex-1 min-w-0 grid grid-cols-3 gap-4 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-sky-900 capitalize truncate">{JENIS_LABEL[item.jenis] ?? item.jenis}</p>
                          <p className="text-[10px] text-sky-400 font-medium mt-0.5">{formatDate(item.tanggal_mulai)}{item.tanggal_selesai && ` - ${formatDate(item.tanggal_selesai)}`}</p>
                        </div>
                        <div className="min-w-0 hidden sm:block"><p className="text-xs text-slate-600 truncate">{item.alasan}</p></div>
                        <div className="flex items-center justify-end gap-3">
                          <Badge className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full", statusConfig.variant === "default" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : statusConfig.variant === "destructive" ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-700 border-amber-200")}>{statusConfig.label}</Badge>
                          <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors"><Eye className="w-3.5 h-3.5 text-sky-400" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (mobile) */}
      <Link href="/pegawai/pengajuan/baru" className="md:hidden fixed bottom-24 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-xl shadow-sky-500/30 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105" aria-label="Buat pengajuan baru">
        <Plus className="w-6 h-6" />
      </Link>
    </>
  );
}
