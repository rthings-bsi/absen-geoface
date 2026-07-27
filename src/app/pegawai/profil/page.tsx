"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Mail, Phone, MapPin, Briefcase, LogOut, Key,
  Loader2, ChevronLeft, Camera, Save, CheckCircle2, XCircle,
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import Link from "next/link";
import { useFaceRecognition } from "@/hooks/use-face-recognition";

type ProfilPegawai = {
  id: string;
  nama: string;
  email: string;
  nip: string;
  jabatan: { id: string; nama: string } | null;
  unit_kerja: string;
  no_hp: string;
  alamat: string;
  foto: string | null;
};

export default function ProfilPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [profil, setProfil] = useState<ProfilPegawai | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ no_hp: "", alamat: "" });
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    password_lama: "", password_baru: "", konfirmasi_password: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceStatus, setFaceStatus] = useState<"idle" | "detecting" | "verified" | "failed">("idle");
  const [cameraActive, setCameraActive] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [faceLoading, setFaceLoading] = useState(true);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const { modelsLoaded, modelError, loadingProgress, loadModels, registerFace, detectFace } = useFaceRecognition();

  useEffect(() => { setMounted(true); }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraActive(true);
    } catch { toast.error("Kamera tidak dapat diakses. Periksa izin browser."); }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((track) => track.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const handleRegisterFace = async () => {
    if (registering) return;
    setRegistering(true);
    try {
      if (!faceDescriptor) throw new Error("Data wajah belum terdeteksi. Pastikan wajah terlihat jelas.");
      const res = await fetch("/api/pegawai/face-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_data: faceDescriptor }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data wajah");
      setFaceRegistered(true);
      setFaceStatus("idle");
      stopCamera();
      toast.success("Registrasi wajah berhasil");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal melakukan registrasi wajah";
      toast.error(message);
    } finally { setRegistering(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pegawai/face-registration");
        const data = await res.json();
        setFaceRegistered(data.registered ?? false);
      } catch { setFaceRegistered(false); }
      finally { setFaceLoading(false); }
    })();
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleVideoReady = useCallback(async () => {
    if (!videoRef.current) return;
    setFaceStatus("detecting");
    try {
      const result = await registerFace(videoRef.current);
      if (result) {
        setFaceDescriptor(result.descriptor);
        setConfidence(result.confidence);
        setFaceStatus(result.confidence >= 70 ? "verified" : "failed");
      } else { setConfidence(0); setFaceStatus("failed"); }
    } catch { setConfidence(0); setFaceStatus("failed"); }
  }, [registerFace]);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.onloadedmetadata = () => { video.play().catch(() => {}); handleVideoReady(); };
  }, [cameraActive]);

  useEffect(() => { fetchProfil(); }, []);

  const fetchProfil = async () => {
    try {
      const res = await fetch("/api/pegawai/profil");
      if (!res.ok) throw new Error("Gagal mengambil profil");
      const data = await res.json();
      setProfil(data);
      setFormData({ no_hp: data.no_hp || "", alamat: data.alamat || "" });
    } catch { toast.error("Gagal memuat data profil"); }
    finally { setLoading(false); }
  };

  const handleSaveProfil = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pegawai/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.message || "Gagal menyimpan profil"); }
      const updated = await res.json();
      setProfil((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditMode(false);
      toast.success("Profil berhasil diperbarui");
    } catch (err: unknown) { const message = err instanceof Error ? err.message : "Terjadi kesalahan"; toast.error(message); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) { toast.error("Konfirmasi password tidak cocok"); return; }
    if (passwordForm.password_baru.length < 6) { toast.error("Password baru minimal 6 karakter"); return; }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/pegawai/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_lama: passwordForm.password_lama, password_baru: passwordForm.password_baru }),
      });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.message || "Gagal mengubah password"); }
      toast.success("Password berhasil diubah");
      setShowPasswordForm(false);
      setPasswordForm({ password_lama: "", password_baru: "", konfirmasi_password: "" });
    } catch (err: unknown) { const message = err instanceof Error ? err.message : "Terjadi kesalahan"; toast.error(message); }
    finally { setChangingPassword(false); }
  };

  const handleLogout = async () => {
    const confirmed = confirm("Apakah Anda yakin ingin logout?");
    if (!confirmed) return;
    await signOut({ callbackUrl: "/login" });
  };

  if (loading) return (
    <div className="min-h-screen relative font-['Inter',sans-serif] text-on-surface selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617]">
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse pb-24">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </main>
    </div>
  );

  if (!profil) return (
    <div className="min-h-screen relative font-['Inter',sans-serif] text-on-surface selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617]">
      <main className="max-w-lg mx-auto px-4 py-12 text-center text-slate-500">
        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Gagal memuat profil</p>
        <button onClick={fetchProfil} className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl hover:bg-indigo-100">Muat Ulang</button>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen relative font-['Inter',sans-serif] text-on-surface selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617]">
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-32 md:pb-12">

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 mb-6 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none flex items-center gap-3 sm:gap-4">
          <Link href="/pegawai/dashboard" className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all rounded-full shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-none mb-1">Profil</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Informasi pribadi Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Avatar Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-6 text-center">
              <div className="relative mb-3 inline-block group">
                <Avatar className="h-24 w-24 ring-4 ring-slate-100 dark:ring-slate-700 shadow-xl mx-auto">
                  {profil.foto ? <AvatarImage src={profil.foto} alt={profil.nama} /> : null}
                  <AvatarFallback className="text-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    {getInitials(profil.nama)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 hover:bg-black/40 cursor-pointer transition-all duration-200">
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5MB"); return; }
                      const fd = new FormData(); fd.append("foto", file);
                      try {
                        const res = await fetch("/api/pegawai/upload-foto", { method: "POST", body: fd });
                        if (!res.ok) throw new Error("Gagal upload");
                        const data = await res.json();
                        setProfil((prev) => (prev ? { ...prev, foto: data.foto } : prev));
                        await update();
                        toast.success("Foto profil berhasil diperbarui");
                      } catch { toast.error("Gagal mengupload foto"); }
                    }} />
                </label>
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
              </div>
              <h2 className="text-xl font-bold text-on-surface">{profil.nama}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{profil.nip}</p>
              <span className="inline-block mt-3 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {profil.jabatan?.nama || "-"}
              </span>
            </div>

            {/* Keamanan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keamanan</h3>
              {showPasswordForm ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  {["password_lama", "password_baru", "konfirmasi_password"].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {field === "password_lama" ? "Password Lama" : field === "password_baru" ? "Password Baru" : "Konfirmasi Password Baru"}
                      </label>
                      <input type="password" value={(passwordForm as any)[field]}
                        onChange={(e) => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-indigo-400/30" required={field !== "konfirmasi_password" || true} minLength={field !== "password_lama" ? 6 : undefined as any} />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordForm({ password_lama: "", password_baru: "", konfirmasi_password: "" }); }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all">Batal</button>
                    <button type="submit" disabled={changingPassword}
                      className="flex-1 py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} Ubah Password
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowPasswordForm(true)}
                  className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <Key className="h-4 w-4" /> Ganti Password
                </button>
              )}
            </div>
            
            {/* Logout Mobile */}
            <button onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-sm font-bold transition-all flex items-center justify-center gap-2 lg:hidden">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Informasi Pribadi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Pribadi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: "Email", value: profil.email },
                  { icon: Briefcase, label: "Unit Kerja", value: profil.unit_kerja || "-" },
                  { icon: Phone, label: "No. HP", value: profil.no_hp || "-", edit: true },
                  { icon: MapPin, label: "Alamat", value: profil.alamat || "-", edit: true, span: true },
                ].map((item, i) => (
                  <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800", item.span && "sm:col-span-2")}>
                    <item.icon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                      {item.edit && editMode && item.label === "No. HP" ? (
                        <input type="tel" value={formData.no_hp} onChange={(e) => setFormData(p => ({ ...p, no_hp: e.target.value }))}
                          className="w-full bg-transparent border-b border-indigo-200 dark:border-indigo-900/50 py-1.5 text-sm font-semibold text-on-surface focus:outline-none focus:border-indigo-500" placeholder="Masukkan nomor HP" />
                      ) : item.edit && editMode && item.label === "Alamat" ? (
                        <textarea value={formData.alamat} onChange={(e) => setFormData(p => ({ ...p, alamat: e.target.value }))}
                          className="w-full bg-transparent border-b border-indigo-200 dark:border-indigo-900/50 py-1.5 text-sm font-semibold text-on-surface focus:outline-none focus:border-indigo-500 resize-none" rows={3} placeholder="Masukkan alamat" />
                      ) : (
                        <p className="text-sm font-semibold text-on-surface mt-1 break-words">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                {editMode ? (
                  <>
                    <button onClick={() => { setEditMode(false); setFormData({ no_hp: profil.no_hp || "", alamat: profil.alamat || "" }); }}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all">Batal</button>
                    <button onClick={handleSaveProfil} disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditMode(true)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-2">
                    <User className="h-4 w-4" /> Edit Profil
                  </button>
                )}
              </div>
            </div>

            {/* Registrasi Wajah */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Registrasi Wajah</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Gunakan untuk presensi menggunakan kamera</p>
                </div>
                {faceLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : faceRegistered ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Terdaftar
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Belum
                  </span>
                )}
              </div>

              {loadingProgress && (
                <div className="flex items-center gap-2.5 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1e1b4b] dark:text-indigo-400 shrink-0" />
                  <p className="text-sm font-bold text-[#1e1b4b] dark:text-indigo-400">{loadingProgress}</p>
                </div>
              )}

              {!faceLoading && !faceRegistered && modelError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Gagal memuat model wajah</p>
                  <p className="text-xs font-medium text-rose-500/80 dark:text-rose-400/80 mt-1">{modelError}</p>
                  <button onClick={loadModels} className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 underline">Coba Lagi</button>
                </div>
              )}

              {!faceLoading && !faceRegistered && cameraActive && (
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 sm:h-80 object-cover" />
                  {faceStatus === "detecting" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="text-white text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                        <p className="text-sm font-bold">Mendeteksi wajah...</p>
                      </div>
                    </div>
                  )}
                  {faceStatus === "verified" && (
                    <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-sm font-bold px-4 py-1.5 rounded-full backdrop-blur-sm">
                      {Math.round(confidence)}%
                    </div>
                  )}
                </div>
              )}

              {!faceLoading && !faceRegistered && (
                <div className="flex gap-3">
                  {!cameraActive ? (
                    <button onClick={startCamera} className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-all flex items-center justify-center gap-2">
                      <Camera className="h-5 w-5" /> Buka Kamera Registrasi
                    </button>
                  ) : (
                    <>
                      <button onClick={stopCamera} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-all">Batal</button>
                      <button onClick={handleRegisterFace} disabled={faceStatus !== "verified" || registering}
                        className="flex-1 py-3 rounded-xl bg-[#1e1b4b] hover:bg-[#312e81] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {registering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />} Simpan Wajah
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
