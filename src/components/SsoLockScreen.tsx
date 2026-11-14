import { useState } from 'react';
import { ArrowUpRight, Loader2, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { PORTAL_OBE_URL, signInWithPasswordSso } from '../lib/ssoAuth';
import type { Session } from '@supabase/supabase-js';

interface SsoLockScreenProps {
  onLoginSuccess: (session: Session) => void;
}

export function SsoLockScreen({ onLoginSuccess }: SsoLockScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const portalLoginUrl = `${PORTAL_OBE_URL}?redirect=${encodeURIComponent(
    window.location.href
  )}`;

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Masukkan email dan kata sandi akun SIMPEL-OBE Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithPasswordSso(email, password);
      if (res.error || !res.session) {
        setErrorMsg(res.error || 'Email atau kata sandi tidak valid.');
        return;
      }
      onLoginSuccess(res.session);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b3d91] text-white">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-[#ffcc00]">
        <div className="bg-[#0b3d91] px-6 py-5 text-white border-b-2 border-[#ffcc00]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ffcc00] text-[#0b3d91] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#ffcc00] tracking-wide uppercase">
                SIMPEL-OBE 04 · Universitas Pattimura
              </p>
              <h1 className="font-display text-base font-bold leading-snug">
                Sesi SSO Diperlukan — Silakan Login Terlebih Dahulu melalui Portal Ekosistem OBE
              </h1>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Akses ke <strong>Buku Nilai &amp; Portofolio Perkuliahan</strong> terhubung dengan autentikasi terpusat Single Sign-On (SSO) pada domain <code className="font-mono bg-slate-100 px-1 rounded">.simpatti.site</code>.
          </p>

          <a
            href={portalLoginUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#ffcc00] hover:bg-amber-400 text-[#0b3d91] font-display text-sm font-bold transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Login via Portal Utama (https://obe.simpatti.site)</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink mx-3 text-[11px] font-medium text-slate-400">
              atau login cepat di tempat
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form onSubmit={handleQuickLogin} className="space-y-3.5">
            {errorMsg && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="sso-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Institusi / Akun OBE
              </label>
              <input
                id="sso-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dosen@unpatti.ac.id"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#0b3d91] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="sso-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Kata Sandi
              </label>
              <input
                id="sso-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#0b3d91] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0b3d91] hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Sesi SSO...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#ffcc00]" />
                  <span>Masuk ke Modul Portofolio</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
