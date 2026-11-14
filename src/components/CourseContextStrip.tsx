import { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Plus, Trash2 } from 'lucide-react';
import type { RpsCourse, RubrikIndicator } from '../types/obe';

interface CourseContextStripProps {
  course: RpsCourse | null;
  indicators: RubrikIndicator[];
  kelas: string;
  tahunAkademik: string;
  isSupabaseConnected: boolean;
  fetchNotice: string | null;
  onOpenAddIndicator: () => void;
  onDeleteIndicator: (id: string) => void;
}

export function CourseContextStrip({
  course,
  indicators,
  kelas,
  tahunAkademik,
  isSupabaseConnected,
  fetchNotice,
  onOpenAddIndicator,
  onDeleteIndicator,
}: CourseContextStripProps) {
  const [showDetails, setShowDetails] = useState(false);

  const totalBobot = indicators.reduce((sum, item) => sum + (Number(item.bobot) || 0), 0);
  const uniqueCpmk = Array.from(new Set(indicators.map((i) => i.cpmk).filter(Boolean)));

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs no-print">
      {!isSupabaseConnected && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 rounded-t-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
          <span>
            Mode Pratinjau Lokal aktif karena URL/Anon Key Supabase pada <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">src/lib/supabase.ts</code> masih menggunakan placeholder. Seluruh kalkulasi nilai, impor Excel/CSV, refleksi AI, dan cetak portofolio tetap berjalan penuh.
          </span>
        </div>
      )}

      {fetchNotice && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-900">
          {fetchNotice}
        </div>
      )}

      <div className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
            <span className="font-mono font-semibold text-blue-900">
              {course?.kode_mk || 'MK-000'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{course?.prodi || 'Program Studi'}</span>
            <span aria-hidden="true">·</span>
            <span>{tahunAkademik || course?.tahun_akademik || '-'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700">{kelas || 'Kelas A'}</span>
          </div>

          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {course?.nama_mk || 'Pilih Mata Kuliah / RPS'}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>
              Dosen Pengampu: <strong className="font-medium text-slate-800">{course?.dosen_pengampu || '-'}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {uniqueCpmk.length} CPMK terpetakan
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {indicators.length} Indikator Rubrik (Total Bobot:{' '}
              <strong className={totalBobot === 100 ? 'text-emerald-700' : 'text-amber-700'}>
                {totalBobot}%
              </strong>
              )
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAddIndicator}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-blue-900" />
            <span>Tambah Indikator Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{showDetails ? 'Tutup Rincian CPMK & Rubrik' : 'Lihat CPMK & Rubrik Modul 3'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-slate-200 px-4 sm:px-6 py-4 bg-slate-50/70 rounded-b-xl space-y-4">
          {course?.cpmk_list && course.cpmk_list.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2">
                Capaian Pembelajaran Mata Kuliah (CPMK) — Sumber Modul 1
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {course.cpmk_list.map((c) => (
                  <div
                    key={c.kode}
                    className="bg-white border border-slate-200 rounded-lg p-3 text-xs"
                  >
                    <div className="font-mono font-semibold text-blue-900 mb-1">{c.kode}</div>
                    <p className="text-slate-600 leading-relaxed">{c.deskripsi}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-700">
                Matriks Instrumen &amp; Indikator Rubrik Penilaian (Sumber Modul 3 + Manual)
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                Total Bobot: {totalBobot}%
              </span>
            </div>

            {indicators.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-lg p-4 text-center text-xs text-slate-500">
                Belum ada indikator rubrik dari Modul 3 untuk mata kuliah ini. Gunakan tombol &ldquo;Tambah Indikator Manual&rdquo; untuk membuat kolom penilaian.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Kode</th>
                      <th className="py-2 px-3 font-semibold">CPMK / Sub-CPMK</th>
                      <th className="py-2 px-3 font-semibold">Bentuk Instrumen</th>
                      <th className="py-2 px-3 font-semibold">Indikator &amp; Kriteria Rubrik</th>
                      <th className="py-2 px-3 font-semibold text-right">Bobot</th>
                      <th className="py-2 px-3 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {indicators.map((ind) => (
                      <tr key={ind.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {ind.kode_indikator}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="font-semibold text-blue-900">{ind.cpmk}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-slate-600">{ind.sub_cpmk}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                          {ind.bentuk_instrumen}
                        </td>
                        <td className="py-2 px-3 text-slate-800">
                          <div className="font-medium">{ind.nama_indikator}</div>
                          {ind.kriteria_deskripsi && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {ind.kriteria_deskripsi}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {ind.bobot}%
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onDeleteIndicator(ind.id)}
                            title="Hapus indikator"
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
