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
  ScanFace,
  LogIn,
  LogOut,
  History,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useFaceRecognition } from "@/hooks/use-face-recognition";
import { playAbsensiSuccess } from "@/lib/sound";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import dynamic from "next/dynamic";

const AbsensiMinimap = dynamic(() => import("@/components/ui/absensi-minimap"), { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse" /> });

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
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; type: "masuk" | "pulang" | null }>({ isOpen: false, type: null });
  const [beritaAcara, setBeritaAcara] = useState("");
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
      const data = await res.json().catch(() => null);
      if (data) setTodayStatus(data);
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser memblokir kamera. Gunakan HTTPS atau akses via localhost.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraActive(true);
      handleLocate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kamera tidak dapat diakses";
      setError(msg);
      setFaceStatus("failed");
    }
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
          berita_acara: type === "pulang" ? beritaAcara : undefined,
        }),
      });
      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Terlalu banyak percobaan");
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal absensi");
      }

      toast.success(type === "masuk" ? "Absen masuk berhasil" : "Absen pulang berhasil");
      playAbsensiSuccess();
      stopCamera();
      setFaceStatus("idle"); setGpsStatus("idle"); setDistance(null); setGpsPosition(null);
      // Refresh status di luar jalur sukses — kegagalan di sini tidak boleh mengubah hasil absen
      try { await fetchTodayStatus(); } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg); toast.error(msg);
    } finally { setIsProcessing(false); }
  };

  const handleAbsenClick = (type: "masuk" | "pulang") => {
    if (type === "pulang") {
      setConfirmDialog({ isOpen: true, type: "pulang" });
    } else {
      handleAbsen(type);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  if (faceRegistered === false) {
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
        </div>

        {/* Empty state - full width, matches main content width */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none overflow-hidden relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 grid-bg opacity-[0.07] pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center px-6 py-16 sm:py-24 text-center z-10">
            {/* Biometric scanner badge */}
            <div className="relative mb-6 mx-auto flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(79,70,229,0.5)] border border-indigo-400 dark:border-indigo-500 relative z-10">
                <ScanFace className="h-10 w-10 text-white" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
              Registrasi Wajah Diperlukan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[28rem] mx-auto leading-relaxed">
              Sistem presensi digital memerlukan verifikasi biometrik wajah demi menjaga keamanan, akurasi, dan keaslian pencatatan kehadiran Anda.
            </p>

            {/* Quick Helper Steps */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mx-auto text-left">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">Buka Profil</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Masuk ke pengaturan profil akun pegawai Anda.</p>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">2</div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">Pindai Wajah</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Posisikan wajah di dalam bingkai kamera pemindai.</p>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">Selesai</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Presensi otomatis aktif setelah wajah terdaftar.</p>
                </div>
              </div>
            </div>

            <Link
              href="/pegawai/profil"
              className="mt-10 inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98]"
            >
              <ScanFace className="w-4 h-4 transition-transform group-hover:scale-110" />
              Daftarkan Wajah Sekarang
            </Link>
          </div>
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
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
            {/* Top accent gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400" />
            {/* Card header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 border border-white/40 dark:border-slate-700">
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Verifikasi Wajah</h2>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {cameraActive ? "Posisikan wajah dalam bingkai" : "Ketuk tombol untuk memulai"}
                  </p>
                </div>
              </div>
              {cameraActive && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 rounded-full border border-rose-100 dark:border-rose-900/50">
                  <span className="w-2 h-2 rounded-full bg-rose-500 live-dot" />
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Live</span>
                </div>
              )}
            </div>

            <div className="px-5">
              <div className="camera-frame aspect-[4/3] rounded-2xl bg-white/40 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                {/* Scanner corner brackets (always present, highlight when active) */}
                <div className={cn("scanner-bracket tl transition-all duration-300", cameraActive ? "opacity-100" : "opacity-30")} />
                <div className={cn("scanner-bracket tr transition-all duration-300", cameraActive ? "opacity-100" : "opacity-30")} />
                <div className={cn("scanner-bracket bl transition-all duration-300", cameraActive ? "opacity-100" : "opacity-30")} />
                <div className={cn("scanner-bracket br transition-all duration-300", cameraActive ? "opacity-100" : "opacity-30")} />

                {cameraActive ? (
                  <>
                    <canvas ref={canvasRef} className="hidden" />
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {/* Scan line */}
                    <div className={cn("scan-line", faceStatus === "detecting" ? "!block" : "hidden")} />
                    {/* Face guide */}
                    <div className={cn("face-guide", (faceStatus === "detecting" || faceStatus === "verified") ? "!block" : "hidden")} />

                    {faceStatus === "detecting" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                        <div className="flex items-center gap-2 text-white">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm font-semibold">Mendeteksi wajah...</span>
                        </div>
                      </div>
                    )}
                    {faceStatus === "verified" && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-emerald-600/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {Math.round(confidence)}% Cocok
                      </div>
                    )}
                    {faceStatus === "failed" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-lg">
                          <XCircle className="w-4 h-4" />
                          Wajah tidak dikenali
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center z-10 p-6">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 text-indigo-300 dark:text-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-sm border border-indigo-50 dark:border-slate-700">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kamera standby</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Ketuk tombol di bawah untuk memulai</p>
                  </div>
                )}
              </div>

              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={cn(
                  "w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                  cameraActive
                    ? "bg-slate-100 dark:bg-slate-800 text-on-surface hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    : "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/25"
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
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
            {/* Top accent gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
            <div className="flex items-center justify-between mb-4 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 border border-white/40 dark:border-slate-700 shadow-md shadow-emerald-500/20">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Status Hari Ini</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Catatan waktu kehadiran</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1">Masuk</p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 dark:text-white leading-none tracking-tight">{todayStatus?.masuk?.slice(0, 5) || "--:--"}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1">Pulang</p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 dark:text-white leading-none tracking-tight">{todayStatus?.pulang?.slice(0, 5) || "--:--"}</p>
              </div>
            </div>

            {/* Wajah → Lokasi → Siap stepper */}
            <div className="flex items-center justify-between mt-5">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all",
                faceStatus === "verified"
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
                  : "bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700"
              )}>
                <span className={cn("w-2 h-2 rounded-full", faceStatus === "verified" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
                <span className={cn("text-[11px] font-bold", faceStatus === "verified" ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400")}>Wajah</span>
              </div>
              <div className={cn("h-px flex-1 mx-2 transition-all", gpsStatus === "success" ? "bg-gradient-to-r from-gray-200 via-blue-300 to-gray-200" : "bg-gray-200 dark:bg-gray-700")} />
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all",
                gpsStatus === "success"
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                  : "bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700"
              )}>
                {gpsStatus === "loading" ? (
                  <span className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-20 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                ) : (
                  <span className={cn("w-2 h-2 rounded-full", gpsStatus === "success" ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600")} />
                )}
                <span className={cn("text-[11px] font-bold", gpsStatus === "success" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")}>Lokasi</span>
              </div>
              <div className={cn("h-px flex-1 mx-2", faceStatus === "verified" ? "bg-gray-200 dark:bg-gray-700" : "bg-gray-200 dark:bg-gray-700")} />
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all",
                faceStatus === "verified" && gpsStatus === "success"
                  ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900"
                  : "bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700"
              )}>
                <span className={cn("w-2 h-2 rounded-full", faceStatus === "verified" && gpsStatus === "success" ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600")} />
                <span className={cn("text-[11px] font-bold", faceStatus === "verified" && gpsStatus === "success" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400")}>Siap</span>
              </div>
            </div>
          </div>

          {/* Location & Actions */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 relative overflow-hidden">
            {/* Top accent gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" />
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                  gpsStatus === "success"
                    ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                    : gpsStatus === "error"
                      ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400"
                      : "bg-gray-50 border-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                )}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Kantor Desa Kuta Mekar</p>
                  <p className={cn("text-[10px] font-medium truncate", distance === null ? "text-gray-400" : distance <= maxDistance ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400")}>
                    {distance !== null ? `${Math.round(distance)}m dari titik absensi ${distance > maxDistance ? "(Luar)" : ""}` : "Menunggu lokasi..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Minimap Box */}
            <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative z-0">
              <AbsensiMinimap
                userPos={gpsPosition}
                officePos={officeLocation}
                radius={maxDistance}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAbsen("masuk")}
                disabled={isProcessing || (todayStatus?.masuk !== null && todayStatus?.masuk !== undefined) || faceStatus !== "verified"}
                className={cn(
                  "relative overflow-hidden group flex flex-col items-center justify-center p-4 rounded-2xl border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all active:scale-[0.98]",
                  (todayStatus?.masuk !== null && todayStatus?.masuk !== undefined) || faceStatus !== "verified"
                    ? "bg-gray-50/80 border-gray-200/50 text-gray-400 dark:bg-gray-800/30 dark:border-gray-700/50 dark:text-gray-600 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700"
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-colors",
                  (todayStatus?.masuk !== null && todayStatus?.masuk !== undefined) || faceStatus !== "verified"
                    ? "bg-gray-200/50 dark:bg-gray-800"
                    : "bg-emerald-200/50 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110"
                )}>
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5 ml-1" />}
                </div>
                <span className="font-extrabold text-sm tracking-tight mb-0.5">MASUK</span>
                <span className={cn("text-[9px] uppercase tracking-widest font-bold",
                  (todayStatus?.masuk !== null && todayStatus?.masuk !== undefined) || faceStatus !== "verified"
                    ? "text-gray-400/70"
                    : "text-emerald-700/70 dark:text-emerald-400/70"
                )}>Absen Pagi</span>
              </button>

              <button
                onClick={() => handleAbsenClick("pulang")}
                disabled={isProcessing || !todayStatus?.masuk || todayStatus?.pulang !== null || faceStatus !== "verified"}
                className={cn(
                  "relative overflow-hidden group flex flex-col items-center justify-center p-4 rounded-2xl border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all active:scale-[0.98]",
                  !todayStatus?.masuk || todayStatus?.pulang !== null || faceStatus !== "verified"
                    ? "bg-gray-50/80 border-gray-200/50 text-gray-400 dark:bg-gray-800/30 dark:border-gray-700/50 dark:text-gray-600 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-800 dark:text-blue-300 border-blue-200/60 dark:border-blue-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-colors",
                  !todayStatus?.masuk || todayStatus?.pulang !== null || faceStatus !== "verified"
                    ? "bg-gray-200/50 dark:bg-gray-800"
                    : "bg-blue-200/50 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 group-hover:scale-110"
                )}>
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5 mr-1" />}
                </div>
                <span className="font-extrabold text-sm tracking-tight mb-0.5">PULANG</span>
                <span className={cn("text-[9px] uppercase tracking-widest font-bold",
                  !todayStatus?.masuk || todayStatus?.pulang !== null || faceStatus !== "verified"
                    ? "text-gray-400/70"
                    : "text-blue-700/70 dark:text-blue-400/70"
                )}>Absen Sore</span>
              </button>
            </div>

            {gpsStatus === "error" && !gpsSkipped && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Lokasi gagal, lewati?</p>
                </div>
                <button onClick={skipGps} className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-900/80 hover:bg-amber-200 dark:hover:bg-amber-800 px-3 py-1.5 rounded-lg transition-colors">Lewati</button>
              </div>
            )}
            {gpsSkipped && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                <MapPin className="w-4 h-4" />
                Verifikasi lokasi dilewati
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Konfirmasi Absen Pulang */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ isOpen: false, type: null });
            setBeritaAcara("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-md shadow-blue-500/25 border border-white/40 dark:border-slate-700">
              <LogOut className="w-6 h-6 text-white ml-1" />
            </div>
            <DialogTitle className="text-lg">Konfirmasi Absen Pulang</DialogTitle>
            <DialogDescription className="text-sm">
              Apakah Anda yakin ingin melakukan absen pulang sekarang?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label htmlFor="berita_acara" className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="w-3.5 h-3.5" />
              Berita Acara / Laporan Kegiatan
            </label>
            <textarea
              id="berita_acara"
              value={beritaAcara}
              onChange={(e) => setBeritaAcara(e.target.value)}
              placeholder="Tuliskan laporan singkat kegiatan hari ini (opsional)..."
              className="w-full min-h-[100px] text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <DialogFooter className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:space-x-0 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialog({ isOpen: false, type: null });
                setBeritaAcara("");
              }}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setConfirmDialog({ isOpen: false, type: null });
                handleAbsen("pulang");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ya, Pulang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
