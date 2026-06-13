"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, UserCheck, CalendarClock, Activity, TrendingUp,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface KpiData {
  totalPegawai: number;
  hadirHariIni: number;
  izinHariIni: number;
  terlambatHariIni: number;
  persenKehadiran: number;
}

interface TrendItem {
  tanggal: string;
  hadir: number;
  izin: number;
  sakit: number;
}

interface AktivitasItem {
  id: number;
  pegawai: string;
  aktivitas: string;
  waktu: string;
  status: string;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [aktivitas, setAktivitas] = useState<AktivitasItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/dashboard/kpi").then((r) => r.json()),
      fetch("/api/admin/dashboard/trend").then((r) => r.json()),
      fetch("/api/admin/dashboard/aktivitas").then((r) => r.json()),
    ])
      .then(([kpiData, trendData, aktivitasData]) => {
        setKpi(kpiData);
        setTrend(Array.isArray(trendData) ? trendData : []);
        setAktivitas((Array.isArray(aktivitasData) ? aktivitasData : []).map((a: Record<string, unknown>) => ({
          id: (a as any).id ?? 0,
          pegawai: (a as any).pegawai_nama || "-",
          aktivitas: (a as any).aksi || "",
          waktu: (a as any).waktu || "",
          status: (a as any).status || (a as any).status_masuk || "",
        })));
      })
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    {
      title: "Total Pegawai",
      value: kpi?.totalPegawai ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Hadir Hari Ini",
      value: kpi?.hadirHariIni ?? 0,
      icon: UserCheck,
      gradient: "from-emerald-400 to-emerald-600",
      lightBg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Izin Hari Ini",
      value: kpi?.izinHariIni ?? 0,
      icon: CalendarClock,
      gradient: "from-amber-400 to-orange-500",
      lightBg: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      title: "Terlambat Hari Ini",
      value: kpi?.terlambatHariIni ?? 0,
      icon: Activity,
      gradient: "from-red-400 to-rose-500",
      lightBg: "bg-red-50 dark:bg-red-950/50",
    },
    {
      title: "Kehadiran",
      value: kpi ? `${kpi.persenKehadiran}%` : "0%",
      icon: TrendingUp,
      gradient: "from-purple-400 to-violet-600",
      lightBg: "bg-purple-50 dark:bg-purple-950/50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-72 w-full rounded-xl" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-72 w-full rounded-xl" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const donutData = [
    { name: "Hadir", value: kpi?.hadirHariIni ?? 0 },
    { name: "Izin", value: kpi?.izinHariIni ?? 0 },
    { name: "Terlambat", value: kpi?.terlambatHariIni ?? 0 },
    { name: "Tidak Hadir", value: Math.max(0, (kpi?.totalPegawai ?? 0) - (kpi?.hadirHariIni ?? 0) - (kpi?.izinHariIni ?? 0) - (kpi?.terlambatHariIni ?? 0)) },
  ].filter((d) => d.value > 0);

  const totalDisplay = donutData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Selamat pagi, {session?.user?.nama || "Admin"} — {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</CardTitle>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${card.gradient} transition-all duration-500`}
                  style={{
                    width: typeof card.value === "string"
                      ? `${parseInt(card.value)}%`
                      : `${Math.min((card.value as number) / (kpi?.totalPegawai || 1) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Tren Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-400 dark:text-gray-500">
                <Activity className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium">Belum ada data tren</p>
                <p className="text-xs mt-1">Data akan muncul setelah ada aktivitas absensi</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIzin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSakit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Area type="monotone" dataKey="hadir" stroke="#10b981" strokeWidth={2} fill="url(#colorHadir)" dot={{ r: 3, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} name="Hadir" />
                  <Area type="monotone" dataKey="izin" stroke="#f59e0b" strokeWidth={2} fill="url(#colorIzin)" dot={{ r: 3, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }} name="Izin" />
                  <Area type="monotone" dataKey="sakit" stroke="#ef4444" strokeWidth={2} fill="url(#colorSakit)" dot={{ r: 3, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} name="Sakit" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Distribusi Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-400 dark:text-gray-500">
                <Activity className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium">Belum ada data distribusi</p>
                <p className="text-xs mt-1">Data akan muncul setelah ada aktivitas absensi</p>
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={115}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDisplay}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {donutData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {aktivitas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
              <Activity className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium">Belum ada aktivitas terbaru</p>
              <p className="text-xs mt-1">Aktivitas pegawai akan muncul di sini</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-blue-200 via-purple-200 to-transparent dark:from-blue-800 dark:via-purple-800 dark:to-transparent" />
              <div className="space-y-0">
                {aktivitas.slice(0, 10).map((item, idx) => {
                  const statusColor =
                    item.status === "hadir"
                      ? "from-emerald-400 to-emerald-600"
                      : item.status === "terlambat"
                        ? "from-red-400 to-rose-500"
                        : "from-amber-400 to-orange-500";
                  const statusLabelColor =
                    item.status === "hadir"
                      ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50"
                      : item.status === "terlambat"
                        ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50"
                        : "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50";
                  return (
                    <div
                      key={item.id}
                      className="relative flex items-start gap-4 py-3.5 group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 rounded-xl px-3 -mx-3 transition-colors"
                    >
                      <div className={`relative z-10 w-9 h-9 rounded-full bg-gradient-to-br ${statusColor} shadow-sm flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-900`}>
                        <span className="text-white text-xs font-bold">
                          {item.pegawai?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.pegawai}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.aktivitas}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.waktu}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusLabelColor}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
