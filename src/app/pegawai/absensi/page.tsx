"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Camera,
  LogIn,
  LogOut,
  History,
} from "lucide-react";
import Link from "next/link";
import { useFaceRecognition } from "@/hooks/use-face-recognition";
import { playAbsensiSuccess } from "@/lib/sound";
import { cn } from "@/lib/utils";

type GPSPosition = { lat: number; lng: number };
type TodayStatus = { masuk: string | null; pulang: string | null; status: string };

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AbsensiPage() {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [faceRegistered, setFaceRegistered] = useState<boolean | null>(null);
  const [faceStatus, setFaceStatus] = useState<"idle" | "detecting" | "verified" | "failed">("idle");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [cameraActive, setCameraActive] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [gpsPosition, setGpsPosition] = useState<GPSPosition | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [officeLocation, setOfficeLocation] = useState<GPSPosition | null>(null);
  const [maxDistance, setMaxDistance] = useState(100);
  const [gpsSkipped, setGpsSkipped] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const { modelsLoaded, modelError, loadingProgress, loadModels, detectFace } = useFaceRecognition();

  const fetchOfficeLocation = useCallback(async () => {
    try {
      const res = await fetch("/api/lokasi-kantor");
      const data = await res.json();
      if (data?.latitude && data?.longitude) {
        setOfficeLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
        setMaxDistance(data.radius || 100);
      }
    } catch {}
  }, []);

  const checkFaceRegistration = async () => {
    try {
      const res = await fetch("/api/pegawai/face-registration");
      setFaceRegistered((await res.json()).registered ?? false);
    } catch { setFaceRegistered(false); }
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await fetch("/api/absensi/hari-ini");
      setTodayStatus(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    checkFaceRegistration();
    fetchTodayStatus();
    fetchOfficeLocation();
  }, [session, fetchOfficeLocation]);

  useEffect(() => () => stopCamera(), []);

  const captureFoto = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const runFaceDetection = useCallback(async () => {
    if (!cameraActive || !videoRef.current) return;
    setFaceStatus("detecting");
    try {
      const result = await detectFace(videoRef.current);
      if (result) {
        setFaceDescriptor(result.descriptor);
        setConfidence(result.confidence);
        if (result.confidence >= 70) {
          setFotoBase64(captureFoto());
          setFaceStatus("verified");
        } else setFaceStatus("failed");
      } else setFaceStatus("failed");
    } catch { setFaceStatus("failed"); }
  }, [cameraActive, captureFoto, detectFace]);

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => { video.play().catch(() => {}); runFaceDetection(); };
    }
  }, [cameraActive, runFaceDetection]);

  const getGPSPosition = useCallback((): Promise<GPSPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("Geolocation tidak didukung")); return; }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        e => { switch (e.code) { case e.PERMISSION_DENIED: reject(new Error("Izin lokasi ditolak")); break; case e.POSITION_UNAVAILABLE: reject(new Error("Lokasi tidak tersedia")); break; case e.TIMEOUT: reject(new Error("Waktu habis")); break; default: reject(new Error("Gagal lokasi")); } },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }), []);

  const handleLocate = useCallback(async () => {
    if (!officeLocation) { setError("Data lokasi kantor belum dimuat"); return; }
    setGpsStatus("loading");
    try {
      const pos = await getGPSPosition();
      setGpsPosition(pos);
      const dist = calculateDistance(pos.lat, pos.lng, officeLocation.lat, officeLocation.lng);
      setDistance(dist);
      setGpsStatus(dist <= maxDistance ? "success" : "error");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal lokasi");
      setGpsStatus("error");
    }
  }, [getGPSPosition, officeLocation, maxDistance]);

  const skipGps = useCallback(() => {
    setGpsSkipped(true);
    setGpsStatus("success");
    setError(null);
    if (officeLocation) {
      setGpsPosition({ lat: officeLocation.lat + 0.001, lng: officeLocation.lng + 0.001 });
      setDistance(50);
    }
  }, [officeLocation]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraActive(true);
      handleLocate();
    } catch { setError("Kamera tidak dapat diakses"); setFaceStatus("failed"); }
  }, [handleLocate]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const handleAbsen = async (type: "masuk" | "pulang") => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pos = gpsPosition || (gpsSkipped ? { lat: -6.2671, lng: 107.2726 } : null);
      if (!pos) throw new Error("Lokasi belum didapatkan");
      if (distance !== null && distance > maxDistance && !gpsSkipped)
        throw new Error(`Luar radius kantor (${Math.round(distance)}m)`);
      if (faceStatus !== "verified") throw new Error("Wajah belum terverifikasi");

      const res = await fetch(`/api/absensi/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pos.lat,
          longitude: pos.lng,
          confidence: Math.round(confidence),
          foto: fotoBase64 || captureFoto(),
          face_descriptor: faceDescriptor,
        }),
      });
      if (res.status === 429) throw new Error((await res.json().catch(() => ({}))).error || "Terlalu banyak percobaan");
      if (!res.ok) throw new Error((await res.json()).error || "Gagal absensi");

      toast.success(type === "masuk" ? "Absen masuk berhasil" : "Absen pulang berhasil");
      playAbsensiSuccess();
      await fetchTodayStatus();
      stopCamera();
      setFaceStatus("idle"); setGpsStatus("idle"); setDistance(null); setGpsPosition(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg); toast.error(msg);
    } finally { setIsProcessing(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  if (faceRegistered === false) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/pegawai/dashboard" className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold text-on-surface">Presensi Harian</h1>
        </div>

        <div className="max-w-sm mx-auto mt-12 sm:mt-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-base font-bold text-on-surface">Registrasi Wajah Diperlukan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Daftarkan wajah Anda di menu Profil untuk memulai presensi.
          </p>
          <Link
            href="/pegawai/profil"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            Buka Profil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/pegawai/dashboard" className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-on-surface">Presensi Harian</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Catat waktu datang dan pulang kerja</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border",
          todayStatus?.status === "hadir" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" :
          todayStatus?.status === "izin" || todayStatus?.status === "sakit" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900" :
          "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", todayStatus?.status === "hadir" ? "bg-emerald-500" : todayStatus?.status === "izin" ? "bg-amber-500" : "bg-slate-400")} />
          {todayStatus?.status || "Belum Absen"}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 p-3 mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          <span className="flex-1 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 shrink-0"><XCircle className="h-4 w-4" /></button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Camera */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="aspect-[4/3] rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                {cameraActive ? (
                  <>
                    <canvas ref={canvasRef} className="hidden" />
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {faceStatus === "detecting" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="flex items-center gap-2 text-white">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm font-semibold">Mendeteksi...</span>
                        </div>
                      </div>
                    )}
                    {faceStatus === "verified" && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {Math.round(confidence)}%
                      </div>
                    )}
                    {faceStatus === "failed" && (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Gagal
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6">
                    <Camera className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Kamera tidak aktif</p>
                  </div>
                )}
              </div>

              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={cn(
                  "w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  cameraActive
                    ? "bg-slate-100 dark:bg-slate-800 text-on-surface hover:bg-slate-200 dark:hover:bg-slate-700"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                )}
              >
                <Camera className="w-4 h-4" />
                {cameraActive ? "Matikan Kamera" : "Aktifkan Kamera"}
              </button>
            </div>

            {(loadingProgress || modelError) && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                {loadingProgress && (
                  <div className="flex items-center gap-2 p-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {loadingProgress}
                  </div>
                )}
                {modelError && (
                  <div className="p-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {modelError}
                    <button onClick={loadModels} className="ml-2 underline">Coba Lagi</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Status Hari Ini</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface">Masuk</span>
                <span className="text-sm font-semibold tabular-nums text-on-surface">{todayStatus?.masuk || "--:--"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface">Pulang</span>
                <span className="text-sm font-semibold tabular-nums text-on-surface">{todayStatus?.pulang || "--:--"}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              <MapPin className="w-3.5 h-3.5" />
              Lokasi Kantor
            </div>
            <p className="text-sm font-semibold text-on-surface">Kantor Desa Kuta Mekar</p>
            {distance !== null ? (
              <p className={cn("text-xs mt-1 font-semibold", distance <= maxDistance ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {Math.round(distance)}m dari kantor {distance > maxDistance ? "(di luar radius)" : ""}
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Jarak belum dihitung</p>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <button
              onClick={() => handleAbsen("masuk")}
              disabled={isProcessing || (todayStatus?.masuk !== null && todayStatus?.masuk !== undefined) || faceStatus !== "verified"}
              className="w-full mb-2.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Absen Masuk
            </button>
            <button
              onClick={() => handleAbsen("pulang")}
              disabled={isProcessing || !todayStatus?.masuk || todayStatus?.pulang !== null || faceStatus !== "verified"}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-on-surface font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Absen Pulang
            </button>

            {gpsStatus === "error" && !gpsSkipped && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Lokasi gagal, lewati?</p>
                <button onClick={skipGps} className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/80 px-3 py-1 rounded-lg">Lewati</button>
              </div>
            )}
            {gpsSkipped && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-3.5 h-3.5" />
                Verifikasi lokasi dilewati
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
