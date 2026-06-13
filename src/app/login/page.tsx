"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, Building2, Check, AlertCircle, ArrowRight, CloudSun, Sparkles, Shield, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <p className="text-sm text-sky-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(searchParams?.get("error") || "");
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(session.user.can_admin ? "/admin/dashboard" : "/pegawai/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <p className="text-sm text-sky-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (status === "authenticated") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email atau password salah");
        setIsLoading(false);
        return;
      }
      router.refresh();
      const res = await fetch("/api/auth/session");
      const sessionData = await res.json();
      if (sessionData?.user?.can_admin) router.replace("/admin/dashboard");
      else router.replace("/pegawai/dashboard");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  }

  const hasEmailError = touched.email && !form.email;
  const hasPasswordError = touched.password && !form.password;

  // Track if elements should animate (after mount)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex overflow-hidden relative">
      {/* 🎬 LAYER 1: Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/50 to-sky-300/20 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite] ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-sky-100/70 to-white/40 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-white/60 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-sky-100/20 via-white/10 to-sky-100/20 rounded-full blur-3xl animate-[spin_30s_linear_infinite]" />

        {/* 🎬 Floating dots */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-sky-300/40 animate-[float-up_8s_ease-in-out_infinite]"
            style={{
              left: `${10 + i * 16}%`,
              bottom: `${10 + (i % 3) * 20}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${7 + i % 4}s`,
            }}
          />
        ))}
      </div>

      {/* 🎬 LAYER 2: Left Section - Information Panel */}
      <div
        className={`hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}
      >
        {/* Logo and Title */}
        <div>
          <div className="inline-flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200/60 to-sky-300/40 rounded-2xl blur-xl opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-xl shadow-sky-200/50 backdrop-blur-xl border border-white/40 animate-[breathe_4s_ease-in-out_infinite]">
              <Building2 className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className={`text-5xl font-black text-sky-950 tracking-tight mb-2 transition-all duration-800 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Sistem Absensi
          </h1>
          <p className={`text-lg text-sky-600 font-semibold mb-4 transition-all duration-800 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Pemerintah Kota Karawang
          </p>

          <p className={`text-sky-700/70 text-base leading-relaxed max-w-md transition-all duration-800 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Platform digital absensi terintegrasi untuk ASN dan tenaga kerja di lingkungan Pemerintah Kota Karawang.
          </p>

          {/* Quick Stats */}
          <div className="flex gap-6 mt-8">
            {['Real-time', 'Terintegrasi', 'Aman'].map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-2 transition-all duration-500 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
                style={{ transitionDelay: `${500 + i * 150}ms` }}
              >
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.5}s` }} />
                <span className="text-sm text-sky-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simple Visual Cards */}
        <div className="space-y-4">
          {[
            { icon: CloudSun, title: 'Absensi Online', desc: 'Catat kehadiran dari mana saja' },
            { icon: Users, title: 'Manajemen Pegawai', desc: 'Kelola data dan riwayat kehadiran' },
            { icon: Shield, title: 'Data Terenkripsi', desc: 'Keamanan data terjamin' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="group">
                <div
                  className={`flex items-center gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-sky-200/50 hover:border-sky-400/50 hover:bg-white/80 shadow-sm hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ${
                    mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                  }`}
                  style={{ transitionDelay: `${700 + i * 150}ms` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-lg shadow-sky-200/50 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-sky-300/50 transition-all duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sky-900 font-semibold text-sm">{item.title}</h3>
                    <p className="text-sky-600/70 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 text-sm text-sky-400 transition-all duration-800 delay-1200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <Sparkles className="w-4 h-4 animate-[sparkle_2s_ease-in-out_infinite]" />
          <span>&copy; {new Date().getFullYear()} Pemerintah Kota Karawang</span>
        </div>
      </div>

      {/* 🎬 LAYER 3: Right Section - Login Form */}
      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative z-10 transition-all duration-1000 delay-300 ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`}
      >
        <div className="w-full max-w-sm">
          {/* Mobile Header */}
          <div className={`lg:hidden text-center mb-12 transition-all duration-800 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="inline-flex items-center justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-xl shadow-sky-200/50 backdrop-blur-xl border border-white/40 animate-[breathe_4s_ease-in-out_infinite]">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-sky-950 tracking-tight mb-1">Sistem Absensi</h1>
            <p className="text-sm font-semibold text-sky-600">Pemerintah Kota Karawang</p>
          </div>

          {/* Card */}
          <div
            className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-sky-200/40 border border-white/60 p-8 transition-all duration-500 hover:shadow-3xl hover:shadow-sky-200/60 hover:scale-[1.01] ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-sky-950">Masuk</h2>
              <ArrowRight className="w-5 h-5 text-sky-500 animate-[bounce-x_2s_ease-in-out_infinite]" />
            </div>
            <p className="text-sky-600/70 mb-8">Akses dashboard absensi Anda</p>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200/60 backdrop-blur-sm flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 motion-safe:animate-[shake_0.5s_ease-in-out]">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Login gagal</p>
                  <p className="text-sm text-red-600/80 mt-0.5">
                    {error === "CredentialsSignin" ? "Email atau password salah" : error}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div className="group">
                <label className="block text-sm font-semibold text-sky-800 mb-2 transition-colors duration-200 group-focus-within:text-sky-600">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onBlur={() => setTouched({ ...touched, email: true })}
                    placeholder="nama@karawangkab.go.id"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-sky-200/60 bg-white/60 text-sky-900 placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm focus:scale-[1.01] focus:shadow-lg focus:shadow-sky-100/50"
                  />
                  {form.email && !hasEmailError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in motion-safe:animate-[pop-in_0.3s_ease-out]">
                      <Check className="w-5 h-5 text-sky-500" />
                    </div>
                  )}
                </div>
                {hasEmailError && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium motion-safe:animate-[fade-slide_0.3s_ease-out]">Email diperlukan</p>
                )}
              </div>

              {/* Password input */}
              <div className="group">
                <label className="block text-sm font-semibold text-sky-800 mb-2 transition-colors duration-200 group-focus-within:text-sky-600">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-sky-200/60 bg-white/60 text-sky-900 placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pr-12 backdrop-blur-sm focus:scale-[1.01] focus:shadow-lg focus:shadow-sky-100/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-all duration-200 p-1.5 rounded-lg hover:bg-sky-50 hover:scale-110 active:scale-95"
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    <div className="transition-transform duration-200 motion-safe:animate-[rotate-fade_0.3s_ease-out]">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                  </button>
                </div>
                {hasPasswordError && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium motion-safe:animate-[fade-slide_0.3s_ease-out]">Password diperlukan</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !form.email || !form.password}
                className="relative w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-sky-200/50 hover:shadow-xl hover:shadow-sky-300/50 hover:scale-[1.02] active:scale-[0.98] overflow-hidden motion-safe:animate-[fade-slide_0.6s_ease-out] motion-safe:hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              >
                {/* Shimmer overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Mobile footer */}
          <div className={`flex items-center justify-center gap-2 mt-6 lg:hidden transition-all duration-800 delay-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <Sparkles className="w-3 h-3 text-sky-300 animate-[sparkle_2s_ease-in-out_infinite]" />
            <p className="text-center text-xs text-sky-400">&copy; {new Date().getFullYear()} Pemerintah Kota Karawang</p>
          </div>
        </div>
      </div>

      {/* 🎬 LAYER 4: Inline keyframes for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-120px) translateX(20px); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 40px -10px rgba(14,165,233,0.2); }
          50% { transform: scale(1.03); box-shadow: 0 15px 50px -5px rgba(14,165,233,0.4); }
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-slide {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotate-fade {
          0% { opacity: 0; transform: rotate(-10deg) scale(0.8); }
          100% { opacity: 1; transform: rotate(0deg) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
