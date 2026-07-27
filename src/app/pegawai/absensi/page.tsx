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
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-8 pb-32 md:pb-margin relative z-10">
        <div className="max-w-md mx-auto mt-12">
          <div className="glass-card rounded-3xl p-8 text-center border border-outline-variant/30 space-y-6 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Registrasi Wajah Diperlukan</h2>
              <p className="text-sm font-semibold text-on-surface-variant mt-2 max-w-[280px] mx-auto">Silakan registrasi data wajah Anda terlebih dahulu di menu Profil.</p>
            </div>
            <Link href="/pegawai/profil" className="block">
              <button className="w-full py-3.5 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition-all active:scale-[0.98]">
                Registrasi Wajah Sekarang
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-['Inter',sans-serif] text-on-surface selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617]">
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-32 md:pb-12">
        {/* Page Title & Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-300">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/pegawai/dashboard" className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all rounded-full shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-none mb-1">Presensi Harian</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Catat waktu datang dan pulang kerja</p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Waktu Kerja Hari Ini</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-bold tracking-tight text-on-surface bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap tabular-nums">
                <span>{todayStatus?.masuk || "--:--"}</span>
                <span className="text-slate-400 dark:text-slate-500 mx-1.5">/</span>
                <span className="text-slate-600 dark:text-slate-300">{todayStatus?.pulang || "--:--"}</span>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm shrink-0",
                todayStatus?.status === "hadir" ? "bg-emerald-50 dark:bg-emerald-950/30 text-[#006c4a] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
                todayStatus?.status === "izin" || todayStatus?.status === "sakit" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" :
                "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", todayStatus?.status === "hadir" ? "bg-emerald-500" : todayStatus?.status === "izin" ? "bg-amber-500" : "bg-slate-400")} />
                {todayStatus?.status || "Belum Absen"}
              </div>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 shadow-sm animate-[shake_0.5s_ease-in-out]">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
            <span className="flex-1 font-semibold">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 shrink-0"><XCircle className="h-4 w-4" /></button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Camera Card */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 lg:col-span-7 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-[#1e1b4b] dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-on-surface">Verifikasi Wajah</h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Posisikan wajah Anda dalam bingkai kamera</p>
                </div>
              </div>
              {cameraActive && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 shadow-sm text-[9px] uppercase tracking-wider font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live
                </div>
              )}
            </div>

            {/* Camera Frame */}
            <div className={cn(
              "camera-frame w-full aspect-[4/3] rounded-2xl mb-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 border border-slate-200 dark:border-slate-700 shadow-inner",
              cameraActive ? "bg-slate-900/5 dark:bg-slate-900/50" : "bg-slate-50 dark:bg-slate-800/50"
            )}>
              <div className={cn("scanner-bracket tl", cameraActive ? "block" : "hidden")} />
              <div className={cn("scanner-bracket tr", cameraActive ? "block" : "hidden")} />
              <div className={cn("scanner-bracket bl", cameraActive ? "block" : "hidden")} />
              <div className={cn("scanner-bracket br", cameraActive ? "block" : "hidden")} />
              <div className={cn("scan-line", cameraActive ? "block" : "hidden")} />
              <div className={cn("face-guide", cameraActive ? "block" : "hidden")} />

              {cameraActive ? (
                <>
                  <canvas ref={canvasRef} className="hidden" />
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl" />
                  {faceStatus === "detecting" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-2xl backdrop-blur-sm">
                      <div className="text-white text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-white/90" />
                        <p className="text-sm font-bold tracking-wide">Mendeteksi Wajah...</p>
                      </div>
                    </div>
                  )}
                  {faceStatus === "verified" && (
                    <div className="absolute top-3 right-3 bg-[#006c4a]/90 dark:bg-emerald-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {Math.round(confidence)}%
                    </div>
                  )}
                  {faceStatus === "failed" && (
                    <div className="absolute top-3 right-3 bg-rose-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Gagal
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center z-10 p-6">
                  <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 text-[#1e1b4b] dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">Kamera Standby</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[240px] mx-auto mt-1">Aktifkan kamera untuk memulai verifikasi wajah</p>
                </div>
              )}
            </div>

            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={cn(
                "w-full py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-[0.99]",
                cameraActive
                  ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-on-surface"
                  : "bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
              )}
            >
              <Camera className="h-4 w-4" />
              {cameraActive ? "Matikan Kamera" : "Aktifkan Kamera"}
            </button>

            {loadingProgress && (
              <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50">
                <Loader2 className="h-4 w-4 animate-spin text-[#1e1b4b] dark:text-indigo-400 shrink-0" />
                <p className="text-xs font-bold text-[#1e1b4b] dark:text-indigo-400">{loadingProgress}</p>
              </div>
            )}
            {modelError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Gagal memuat model wajah</p>
                <p className="text-[10px] font-medium text-rose-500/80 dark:text-rose-400/80 mt-0.5">{modelError}</p>
                <button onClick={loadModels} className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 underline">Coba Lagi</button>
              </div>
            )}
          </section>

          {/* Right Column: Actions & Info */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#006c4a]/10 dark:bg-emerald-900/20 text-[#006c4a] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-on-surface">Tombol Presensi</h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Pastikan lokasi &amp; wajah terverifikasi</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => handleAbsen("masuk")}
                  disabled={isProcessing || (todayStatus?.masuk !== null && todayStatus?.masuk !== undefined) || faceStatus !== "verified"}
                  className="relative overflow-hidden group flex flex-col items-center justify-center p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-[#006c4a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800/50 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-emerald-100"
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 mb-2.5 text-[#006c4a] dark:text-emerald-400 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-emerald-900/30 flex items-center justify-center mb-2.5 shadow-sm text-[#006c4a] dark:text-emerald-400">
                      <LogIn className="h-5 w-5" />
                    </div>
                  )}
                  <span className="font-bold text-base tracking-tight mb-0.5">Masuk</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">Absen Pagi</span>
                </button>

                <button
                  onClick={() => handleAbsen("pulang")}
                  disabled={isProcessing || !todayStatus?.masuk || todayStatus?.pulang !== null || faceStatus !== "verified"}
                  className="relative overflow-hidden group flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800/50 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-blue-100"
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 mb-2.5 text-blue-700 dark:text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-blue-900/30 flex items-center justify-center mb-2.5 shadow-sm text-blue-700 dark:text-blue-400">
                      <LogOut className="h-5 w-5" />
                    </div>
                  )}
                  <span className="font-bold text-base tracking-tight mb-0.5">Pulang</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">Absen Sore</span>
                </button>
              </div>

              {/* Stepper Status */}
              <div className="flex items-center justify-between px-1 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all text-xs font-bold",
                  faceStatus === "verified"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-[#006c4a] dark:text-emerald-400"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", faceStatus === "verified" ? "bg-emerald-500" : "bg-slate-400")} />
                  <span>Wajah</span>
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700 mx-2" />
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all text-xs font-bold",
                  gpsStatus === "success"
                    ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {gpsStatus === "loading" ? (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  ) : (
                    <div className="relative flex items-center justify-center shrink-0">
                      {gpsStatus === "success" && <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 opacity-20 animate-ping" />}
                      <span className={cn("inline-flex rounded-full h-1.5 w-1.5", gpsStatus === "success" ? "bg-blue-500" : "bg-slate-400")} />
                    </div>
                  )}
                  <span>Lokasi</span>
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700 mx-2" />
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all text-xs font-bold",
                  faceStatus === "verified" && gpsStatus === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-[#006c4a] dark:text-emerald-400"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", faceStatus === "verified" && gpsStatus === "success" ? "bg-emerald-500" : "bg-slate-400")} />
                  <span>Siap</span>
                </div>
              </div>

              {gpsStatus === "error" && !gpsSkipped && (
                <div className="mt-6 flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-sm animate-fade-slide-up">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Lokasi gagal dideteksi, lewati?</p>
                  </div>
                  <button onClick={skipGps} className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/80 px-3 py-1.5 rounded-lg transition-colors">Lewati</button>
                </div>
              )}
              {gpsSkipped && (
                <div className="mt-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                  <MapPin className="h-4 w-4 text-[#1e1b4b] dark:text-indigo-400 shrink-0" />
                  <span className="text-xs text-[#1e1b4b] dark:text-indigo-400 font-bold">Verifikasi lokasi dilewati</span>
                </div>
              )}
            </section>

            {/* Location Info Card */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lokasi Kantor</h3>
                  <p className="text-sm font-bold text-on-surface mt-0.5">Kantor Desa Kuta Mekar</p>
                  {distance !== null ? (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Jarak Anda: <span className={cn("font-bold", distance <= maxDistance ? "text-[#006c4a] dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{Math.round(distance)} meter</span> (Maks: {maxDistance}m)
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Jarak belum dihitung (kamera standby)</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
