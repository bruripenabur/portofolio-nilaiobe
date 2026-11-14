import {
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  Database,
  LogOut,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import type { SsoUserIdentity } from '../lib/ssoAuth';
import { PORTAL_OBE_URL } from '../lib/ssoAuth';
import type { RpsCourse } from '../types/obe';

interface TopBarProps {
  courses: RpsCourse[];
  selectedRpsId: string;
  onSelectCourse: (rpsId: string) => void;
  onRefreshCourses: () => void;
  isLoadingCourses: boolean;
  isSupabaseConnected: boolean;
  userIdentity: SsoUserIdentity;
  onSignOut: () => void;
}

export function TopBar({
  courses,
  selectedRpsId,
  onSelectCourse,
  onRefreshCourses,
  isLoadingCourses,
  isSupabaseConnected,
  userIdentity,
  onSignOut,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b-2 border-amber-500 shadow-sm no-print">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 space-y-2.5">
        {/* Baris Identitas SSO & Navigasi Portal */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <a
              href={PORTAL_OBE_URL}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-blue-900 border border-slate-700 hover:border-amber-400/70 text-amber-300 font-semibold transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Kembali ke Portal OBE</span>
            </a>
            <span className="hidden md:inline text-slate-500">·</span>
            <span className="hidden md:inline text-slate-400">
              Pusat Kurikulum dan Inovasi Pembelajaran · Universitas Pattimura
            </span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <div className="flex items-center gap-2 text-right">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline" />
              <div className="leading-tight">
                <span className="font-semibold text-white">
                  {userIdentity.fullName || 'Pengguna SSO'}
                </span>
                {userIdentity.prodi && (
                  <span className="text-slate-300 ml-1.5">
                    · {userIdentity.prodi}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-red-900/70 border border-slate-700 hover:border-red-400/60 text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Baris Utama Judul Modul & Pemilih RPS */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-900 border border-amber-400/60 flex items-center justify-center shrink-0 text-amber-400">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
                  SIMPEL-OBE 04: BUKU NILAI &amp; PORTOFOLIO PERKULIAHAN
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-slate-950 whitespace-nowrap shrink-0">
                  Inovasi Mutu Akademik
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Eksekusi Penilaian Berbasis Rubrik &amp; Bukti Mutu Pembelajaran (Direct Evidence)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
              <label
                htmlFor="rps-selector"
                className="text-xs font-medium text-amber-300 whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Pilih Mata Kuliah / RPS Tersimpan</span>
              </label>
              <div className="relative flex items-center gap-1.5">
                <div className="relative flex-1 sm:w-[320px]">
                  <select
                    id="rps-selector"
                    value={selectedRpsId}
                    onChange={(e) => onSelectCourse(e.target.value)}
                    disabled={isLoadingCourses}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 hover:border-amber-400/70 focus:border-amber-400 focus:outline-none text-white text-xs sm:text-sm rounded-lg pl-3 pr-8 py-2 transition-colors truncate cursor-pointer"
                  >
                    {courses.length === 0 ? (
                      <option value="">-- Memuat daftar RPS --</option>
                    ) : (
                      courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.kode_mk} — {course.nama_mk} ({course.prodi})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <button
                  type="button"
                  onClick={onRefreshCourses}
                  disabled={isLoadingCourses}
                  title={
                    isSupabaseConnected
                      ? 'Muat ulang daftar RPS dari Supabase'
                      : 'Muat ulang data RPS'
                  }
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
