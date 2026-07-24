"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, ArrowRight, ScanFace, MapPin, Shield, LockIcon } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Menyiapkan...</p>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(session.user.can_admin ? "/admin/dashboard" : "/pegawai/dashboard");
    }
  }, [status, session, router]);

  if (status === "authenticated") return null;

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1120]">
      <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border-[3px] border-slate-200 dark:border-slate-800 rounded-[28px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.06)]">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
          <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
        </div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Otentikasi...</p>
      </div>
    </div>
  );

  if (status === "loading" || isLoading) return <LoadingSpinner />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      clearTimeout(timeoutId);

      if (result?.error) { setError("Email atau password salah."); setIsLoading(false); return; }

      router.refresh();
      const res = await fetch("/api/auth/session", { signal: controller.signal });
      const sessionData = await res.json();
      if (sessionData?.user?.can_admin) router.replace("/admin/dashboard");
      else router.replace("/pegawai/dashboard");
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(err.name === 'AbortError' ? "Koneksi timeout. Cek jaringan." : "Sistem sibuk, coba lagi.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-violet-500/30">
      {/* Full-screen grid bg */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00000008 1px, transparent 1px),
            linear-gradient(to bottom, #00000008 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px"
        }}
      />
      <div className="fixed top-0 left-0 right-0 h-screen z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Form Box */}
      <div className={`relative w-full max-w-[420px] overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] border-[3px] border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] dark:hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] hover:-translate-y-1 transition-all duration-500 z-10 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500" />

        <div className="mb-8 mt-2">
          {/* Logo + Title */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-[18px] bg-white border-[3px] border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)] p-2">
              <img src="/lambang-karawang.png" alt="" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">absenin.</h1>
            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mt-0.5">Desa Kuta Mekar</p>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Masuk<span className="text-violet-500">.</span>
            </h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">isi kredensial lo di sini.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-[16px] bg-rose-50 dark:bg-rose-950/30 border-[3px] border-rose-300 dark:border-rose-800 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.2)] animate-[shake_0.5s_ease-in-out]">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-rose-700 dark:text-rose-300 font-black text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] transition-colors group-focus-within:text-violet-500">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@karawangkab.go.id" required disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-[16px] border-[3px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.1)] transition-all font-bold disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5 group">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] transition-colors group-focus-within:text-violet-500">Password</label>
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required disabled={isLoading}
                className="w-full pl-4 pr-12 py-3.5 rounded-[16px] border-[3px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.1)] transition-all font-bold disabled:opacity-50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[12px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={isLoading || !form.email || !form.password}
              className="group relative w-full overflow-hidden bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-black text-sm py-4 rounded-[18px] transition-all duration-100 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed border-b-[6px] border-violet-900 hover:border-b-[3px] hover:translate-y-[3px] active:translate-y-[6px] active:border-b-0 shadow-sm"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isLoading ? (
                <div className="relative z-10 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span className="relative z-10">Login...</span></div>
              ) : (
                <span className="relative z-10 flex items-center gap-2">Let&apos;s Go!<ArrowRight className="w-4.5 h-4.5 transition-all group-hover:translate-x-1 group-hover:-rotate-12" /></span>
              )}
            </button>
          </div>
          <div className="pt-4 text-center">
            <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              demo: <span className="text-slate-700 dark:text-slate-300">admin@absensi.test</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
