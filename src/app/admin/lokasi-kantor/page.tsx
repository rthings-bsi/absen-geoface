"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Save, Crosshair, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const MapPicker = dynamic(() => import("@/components/ui/map-picker"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />,
});

interface LokasiKantor {
  id: number;
  nama: string;
  alamat: string;
  latitude: string;
  longitude: string;
  radius: number;
  jam_kerja_id?: number;
}

export default function LokasiKantorPage() {
  const [data, setData] = useState<LokasiKantor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    alamat: "",
    latitude: "",
    longitude: "",
    radius: 100,
    jam_kerja_id: "",
  });
  const [jamKerjaList, setJamKerjaList] = useState<{ id: number; nama: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/lokasi-kantor");
        const json = await res.json();
        const item = Array.isArray(json) ? json[0] : json?.data ? json.data[0] : json;
        if (item && item.id) {
          setData(item);
          setForm({
            nama: item.nama || "",
            alamat: item.alamat || "",
            latitude: item.latitude || "",
            longitude: item.longitude || "",
            radius: item.radius || 100,
            jam_kerja_id: item.jam_kerja_id ? String(item.jam_kerja_id) : "",
          });
        }
      } catch {
        toast.error("Gagal memuat data lokasi kantor");
      } finally {
        setLoading(false);
      }
    };

    const fetchJamKerja = async () => {
      try {
        const res = await fetch("/api/jam-kerja");
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setJamKerjaList(list);
      } catch {
        // silent
      }
    };

    fetchData();
    fetchJamKerja();
  }, []);

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolokasi");
      return;
    }
    toast.info("Mengambil lokasi saat ini...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        toast.success("Lokasi berhasil didapatkan");
      },
      (error) => {
        toast.error("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
      },
      { enableHighAccuracy: true }
    );
  };

  const searchLocation = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setForm((prev) => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon,
        }));
        toast.success("Lokasi ditemukan");
      } else {
        toast.error("Lokasi tidak ditemukan");
      }
    } catch {
      toast.error("Gagal mencari lokasi");
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!form.nama || !form.alamat || !form.latitude || !form.longitude) {
      toast.error("Nama, alamat, latitude, dan longitude wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = data?.id
        ? `/api/lokasi-kantor?id=${data.id}`
        : "/api/lokasi-kantor";
      const method = data?.id ? "PUT" : "POST";
      const body = {
        ...form,
        radius: Number(form.radius),
        jam_kerja_id: form.jam_kerja_id ? Number(form.jam_kerja_id) : null,
      };

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
      toast.success("Lokasi kantor berhasil disimpan");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan lokasi kantor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Lokasi Kantor</h1>
          <p className="text-muted-foreground">Pengaturan lokasi kantor untuk absensi</p>
        </div>
        <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Lokasi Kantor</h1>
        <p className="text-muted-foreground">Pengaturan lokasi kantor untuk absensi berbasis GPS</p>
      </div>

      <Card className="border-white/40 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">Detail Lokasi Kantor</CardTitle>
              <CardDescription>
                Atur titik koordinat dan radius absensi kantor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lokasi</label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama kantor"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Radius Absensi (meter)</label>
              <Input
                type="number"
                value={form.radius}
                onChange={(e) => setForm({ ...form, radius: parseInt(e.target.value) || 0 })}
                min={1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="Alamat lengkap kantor"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Titik Lokasi (Maps)</label>
              <Button type="button" variant="outline" size="sm" onClick={locateUser}>
                <Crosshair className="w-4 h-4 mr-2" />
                Gunakan Lokasi Saat Ini
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi (contoh: Monas, Jakarta)"
                onKeyDown={(e) => e.key === "Enter" && searchLocation()}
              />
              <Button type="button" variant="secondary" onClick={searchLocation} disabled={searching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <MapPicker
              latitude={Number(form.latitude) || -6.2088}
              longitude={Number(form.longitude) || 106.8456}
              radius={form.radius}
              onChange={(lat, lng) => setForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Latitude</label>
              <Input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="-6.2088"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Longitude</label>
              <Input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="106.8456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Jam Kerja Default</label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={form.jam_kerja_id}
              onChange={(e) => setForm({ ...form, jam_kerja_id: e.target.value })}
            >
              <option value="">Pilih Jam Kerja</option>
              {jamKerjaList.map((jk) => (
                <option key={jk.id} value={jk.id}>{jk.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
