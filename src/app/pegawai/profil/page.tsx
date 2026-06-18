"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Card, { CardContent } from "@/components/ui/card";
import { Button, Badge, Skeleton } from "@/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Mail, Phone, MapPin, Briefcase, LogOut, Key,
  Loader2, ChevronLeft, Camera, Save, CheckCircle2, XCircle,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
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
  const { modelsLoaded, modelError, registerFace, detectFace } = useFaceRecognition();

  useEffect(() => { setMounted(true); }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      toast.error("Kamera tidak dapat diakses. Periksa izin browser.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const handleRegisterFace = async () => {
    if (registering) return;
    setRegistering(true);
    try {
      if (!faceDescriptor) {
        throw new Error("Data wajah belum terdeteksi. Pastikan wajah terlihat jelas.");
      }
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
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pegawai/face-registration");
        const data = await res.json();
        setFaceRegistered(data.registered ?? false);
      } catch {
        setFaceRegistered(false);
      } finally {
        setFaceLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const handleVideoReady = useCallback(async () => {
    if (!videoRef.current) return;
    setFaceStatus("detecting");
    try {
      const result = await registerFace(videoRef.current);
      if (result) {
        setFaceDescriptor(result.descriptor);
        setConfidence(result.confidence);
        setFaceStatus(result.confidence >= 70 ? "verified" : "failed");
      } else {
        setConfidence(0);
        setFaceStatus("failed");
      }
    } catch {
      setConfidence(0);
      setFaceStatus("failed");
    }
  }, [registerFace]);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.onloadedmetadata = () => {
      video.play().catch(() => {});
      handleVideoReady();
    };
  }, [cameraActive]);

  useEffect(() => { fetchProfil(); }, []);

  const fetchProfil = async () => {
    try {
      const res = await fetch("/api/pegawai/profil");
      if (!res.ok) throw new Error("Gagal mengambil profil");
      const data = await res.json();
      setProfil(data);
      setFormData({ no_hp: data.no_hp || "", alamat: data.alamat || "" });
    } catch {
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfil = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pegawai/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menyimpan profil");
      }
      const updated = await res.json();
      setProfil((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditMode(false);
      toast.success("Profil berhasil diperbarui");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (passwordForm.password_baru.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/pegawai/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password_lama: passwordForm.password_lama,
          password_baru: passwordForm.password_baru,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal mengubah password");
      }
      toast.success("Password berhasil diubah");
      setShowPasswordForm(false);
      setPasswordForm({ password_lama: "", password_baru: "", konfirmasi_password: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = confirm("Apakah Anda yakin ingin logout?");
    if (!confirmed) return;
    await signOut({ callbackUrl: "/login" });
  };

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
        <Skeleton className="h-8 w-32 bg-sky-100/50" />
        <div className="flex flex-col items-center gap-3 py-6">
          <Skeleton className="h-20 w-20 rounded-full bg-sky-100/50" />
          <Skeleton className="h-5 w-40 bg-sky-100/50" />
          <Skeleton className="h-4 w-28 bg-sky-100/50" />
        </div>
        <Skeleton className="h-40 rounded-xl bg-sky-100/50" />
        <Skeleton className="h-12 rounded-xl bg-sky-100/50" />
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center py-12 pb-24 text-sky-500">
        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Gagal memuat profil</p>
        <Button onClick={fetchProfil} variant="outline" size="sm" className="mt-3 border-sky-200 text-sky-700">Muat Ulang</Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <div className={`flex items-center gap-2 mb-2 transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <Link href="/pegawai" className="p-2 rounded-xl hover:bg-sky-50 transition">
          <ChevronLeft className="h-5 w-5 text-sky-500" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-sky-950">Profil</h1>
          <p className="text-xs text-sky-500">Informasi pribadi Anda</p>
        </div>
      </div>

      <div className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/50 shadow-xl shadow-sky-200/20 p-6 transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 group">
            <Avatar className="h-20 w-20 ring-4 ring-sky-100 shadow-xl">
              {profil.foto ? (
                <AvatarImage src={profil.foto} alt={profil.nama} />
              ) : (
                <AvatarFallback className="text-lg bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                  {getInitials(profil.nama)}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Upload button overlay */}
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 cursor-pointer transition-all duration-200">
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Ukuran file maksimal 5MB");
                    return;
                  }
                  const formData = new FormData();
                  formData.append("foto", file);
                  try {
                    const res = await fetch("/api/pegawai/upload-foto", {
                      method: "POST",
                      body: formData,
                    });
                    if (!res.ok) throw new Error("Gagal upload");
                    const data = await res.json();
                    setProfil((prev) => (prev ? { ...prev, foto: data.foto } : prev));
                    await update();
                    toast.success("Foto profil berhasil diperbarui");
                  } catch {
                    toast.error("Gagal mengupload foto");
                  }
                }}
              />
            </label>

            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <h2 className="text-lg font-bold text-sky-950">{profil.nama}</h2>
          <p className="text-sm text-sky-500">{profil.nip}</p>
          <Badge className="mt-2 bg-sky-50 text-sky-700 border-sky-200">{profil.jabatan?.nama || "-"}</Badge>
        </div>
      </div>

      <div className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/50 shadow-xl shadow-sky-200/20 p-5 space-y-4 transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider">Informasi Pribadi</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/50">
            <Mail className="h-4 w-4 text-sky-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-sky-500 font-medium">Email</p>
              <p className="text-sm font-medium text-sky-900 truncate">{profil.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/50">
            <Briefcase className="h-4 w-4 text-sky-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-sky-500 font-medium">Unit Kerja</p>
              <p className="text-sm font-medium text-sky-900 truncate">{profil.unit_kerja || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/50">
            <Phone className="h-4 w-4 text-sky-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-sky-500 font-medium">No. HP</p>
              {editMode ? (
                <input type="tel" value={formData.no_hp} onChange={(e) => setFormData((prev) => ({ ...prev, no_hp: e.target.value }))}
                  className="w-full bg-transparent border-b border-sky-300 py-1 text-sm font-medium text-sky-900 focus:outline-none focus:border-sky-500"
                  placeholder="Masukkan nomor HP" />
              ) : (
                <p className="text-sm font-medium text-sky-900">{profil.no_hp || "-"}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/50">
            <MapPin className="h-4 w-4 text-sky-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-sky-500 font-medium">Alamat</p>
              {editMode ? (
                <textarea value={formData.alamat} onChange={(e) => setFormData((prev) => ({ ...prev, alamat: e.target.value }))}
                  className="w-full bg-transparent border-b border-sky-300 py-1 text-sm font-medium text-sky-900 focus:outline-none focus:border-sky-500 resize-none"
                  rows={2} placeholder="Masukkan alamat" />
              ) : (
                <p className="text-sm font-medium text-sky-900">{profil.alamat || "-"}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          {editMode ? (
            <>
              <Button variant="outline" className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50"
                onClick={() => { setEditMode(false); setFormData({ no_hp: profil.no_hp || "", alamat: profil.alamat || "" }); }}>
                Batal
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md"
                onClick={handleSaveProfil} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </>
          ) : (
            <Button variant="outline" className="w-full border-sky-200 text-sky-700 hover:bg-sky-50" onClick={() => setEditMode(true)}>
              <User className="h-4 w-4 mr-2" /> Edit Profil
            </Button>
          )}
        </div>
      </div>

      <div className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/50 shadow-xl shadow-sky-200/20 p-5 space-y-4 transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider">Registrasi Wajah</h3>
          {faceLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          ) : faceRegistered ? (
            <Badge className="bg-sky-100 text-sky-700 border-sky-200">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Terdaftar
            </Badge>
          ) : (
            <Badge className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3 w-3 mr-1" /> Belum
            </Badge>
          )}
        </div>
        {!faceLoading && !faceRegistered && modelError && (
          <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/60">
            <p className="text-xs font-medium text-red-700">Gagal memuat model wajah</p>
            <p className="text-[10px] text-red-500 mt-0.5">{modelError}</p>
          </div>
        )}
        {!faceLoading && !faceRegistered && cameraActive && (
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
            {faceStatus === "detecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Mendeteksi wajah...</p>
                </div>
              </div>
            )}
            {faceStatus === "verified" && (
              <div className="absolute top-2 right-2 bg-sky-500 text-white text-xs px-2 py-1 rounded-full">
                {Math.round(confidence)}%
              </div>
            )}
          </div>
        )}
        {!faceLoading && !faceRegistered && (
          <div className="flex gap-2">
            {!cameraActive ? (
              <Button onClick={startCamera} variant="outline" className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50">
                <Camera className="h-4 w-4 mr-2" /> Buka Kamera
              </Button>
            ) : (
              <>
                <Button onClick={stopCamera} variant="outline" className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50">
                  <XCircle className="h-4 w-4 mr-2" /> Batal
                </Button>
                <Button onClick={handleRegisterFace} disabled={faceStatus !== "verified" || registering}
                  className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md">
                  {registering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                  Simpan Wajah
                </Button>
              </>
            )}
          </div>
        )}
        {!faceLoading && faceRegistered && (
          <p className="text-xs text-sky-500">Data wajah Anda telah terdaftar dan siap digunakan untuk absensi.</p>
        )}
      </div>

      <div className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/50 shadow-xl shadow-sky-200/20 p-5 space-y-4 transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider">Keamanan</h3>
        {showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-sky-600 mb-1">Password Lama</label>
              <input type="password" value={passwordForm.password_lama}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, password_lama: e.target.value }))}
                className="w-full rounded-xl border border-sky-200/60 bg-white/60 px-3 py-2.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 backdrop-blur-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-sky-600 mb-1">Password Baru</label>
              <input type="password" value={passwordForm.password_baru}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, password_baru: e.target.value }))}
                className="w-full rounded-xl border border-sky-200/60 bg-white/60 px-3 py-2.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 backdrop-blur-sm" required minLength={6} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sky-600 mb-1">Konfirmasi Password Baru</label>
              <input type="password" value={passwordForm.konfirmasi_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, konfirmasi_password: e.target.value }))}
                className="w-full rounded-xl border border-sky-200/60 bg-white/60 px-3 py-2.5 text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 backdrop-blur-sm" required />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 border-sky-200 text-sky-700"
                onClick={() => { setShowPasswordForm(false); setPasswordForm({ password_lama: "", password_baru: "", konfirmasi_password: "" }); }}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md" disabled={changingPassword}>
                {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                Ubah Password
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" className="w-full border-sky-200 text-sky-700 hover:bg-sky-50" onClick={() => setShowPasswordForm(true)}>
            <Key className="h-4 w-4 mr-2" /> Ganti Password
          </Button>
        )}
      </div>

      <Button variant="destructive" className="md:hidden w-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Logout
      </Button>
    </div>
  );
}
