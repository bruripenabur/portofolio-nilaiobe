import { useState } from 'react';
import { CheckCircle2, ExternalLink, FileDown, Loader2, Printer } from 'lucide-react';
import type {
  CalculatedStudentGrade,
  GradeStats,
  PortfolioFile,
  RpsCourse,
  RubrikIndicator,
} from '../types/obe';
import { LETTER_GRADES_ORDER } from '../utils/grading';
import { exportPortfolioToPdf } from '../utils/pdfExport';

interface Tab4PrintPreviewProps {
  course: RpsCourse | null;
  kelas: string;
  tahunAkademik: string;
  indicators: RubrikIndicator[];
  calculatedGrades: CalculatedStudentGrade[];
  stats: GradeStats;
  files: PortfolioFile[];
  reflectionText: string;
}

const CATEGORY_LABELS: Record<PortfolioFile['category'], string> = {
  tinggi: 'Sampel Karya Nilai Tinggi (Terbaik)',
  sedang: 'Sampel Karya Nilai Sedang (Menengah)',
  rendah: 'Sampel Karya Nilai Rendah (Kurang)',
  bap: 'Berita Acara Perkuliahan (BAP) & Presensi',
};

export function Tab4PrintPreview({
  course,
  kelas,
  tahunAkademik,
  indicators,
  calculatedGrades,
  stats,
  files,
  reflectionText,
}: Tab4PrintPreviewProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportedFileName, setExportedFileName] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setExportedFileName(null);
    try {
      const fileName = exportPortfolioToPdf({
        course,
        kelas,
        tahunAkademik,
        indicators,
        calculatedGrades,
        stats,
        files,
        reflectionText,
      });
      setExportedFileName(fileName);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const totalWeight = indicators.reduce((s, i) => s + (Number(i.bobot) || 0), 0);

  return (
    <div className="space-y-5">
      {/* Toolbar Pratinjau (Disembunyikan saat cetak) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 no-print">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Pratinjau Dokumen Laporan Portofolio Mata Kuliah
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh dokumen PDF formal standar akreditasi Universitas Pattimura atau cetak langsung melalui browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyusun PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Ekspor PDF Resmi (jsPDF)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Laporan Portofolio Mata Kuliah</span>
          </button>
        </div>
      </div>

      {exportedFileName && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Dokumen PDF akreditasi berhasil diunduh: <strong className="font-mono">{exportedFileName}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExportedFileName(null)}
            className="text-emerald-800 hover:underline font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Checklist Kelengkapan (Disembunyikan saat cetak) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2.5 text-xs">
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              course ? 'text-emerald-600' : 'text-slate-300'
            }`}
          />
          <span className="font-medium text-slate-800">Identitas MK &amp; Rubrik ({indicators.length})</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2.5 text-xs">
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              calculatedGrades.length > 0 ? 'text-emerald-600' : 'text-slate-300'
            }`}
          />
          <span className="font-medium text-slate-800 tabular-nums">
            Buku Nilai ({calculatedGrades.length} Mhs)
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2.5 text-xs">
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              files.length > 0 ? 'text-emerald-600' : 'text-amber-500'
            }`}
          />
          <span className="font-medium text-slate-800 tabular-nums">
            Lampiran Bukti ({files.length} Berkas)
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2.5 text-xs">
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              reflectionText.trim().length > 0 ? 'text-emerald-600' : 'text-amber-500'
            }`}
          />
          <span className="font-medium text-slate-800">Refleksi Evaluasi Dosen</span>
        </div>
      </div>

      {/* Dokumen A4 Siap Cetak */}
      <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xs print-only-container space-y-7 text-slate-900">
        {/* Kop Resmi Institusi */}
        <header className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <p className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            Kementerian Pendidikan Tinggi, Sains, dan Teknologi
          </p>
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
            UNIVERSITAS PATTIMURA
          </h2>
          <p className="text-xs font-semibold text-blue-900">
            PUSAT KURIKULUM DAN INOVASI PEMBELAJARAN (PKIP) — EKOSISTEM DIGITAL SIMPEL-OBE
          </p>
          <div className="pt-2">
            <span className="inline-block border border-slate-900 px-3 py-1 text-xs font-bold tracking-wide">
              LAPORAN PORTOFOLIO PERKULIAHAN &amp; BUKU NILAI BERBASIS RUBRIK
            </span>
          </div>
        </header>

        {/* 1. Identitas Mata Kuliah */}
        <section className="print-break-inside-avoid space-y-2.5">
          <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">
            01. Identitas Mata Kuliah &amp; Pelaksanaan Kelas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Kode / Nama Mata Kuliah</span>
              <span className="font-semibold text-slate-900 text-right">
                {course?.kode_mk || '-'} — {course?.nama_mk || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Program Studi</span>
              <span className="font-semibold text-slate-900 text-right">{course?.prodi || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Kelas / Periode Akademik</span>
              <span className="font-semibold text-slate-900 text-right">
                {kelas} ({tahunAkademik})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Dosen Pengampu</span>
              <span className="font-semibold text-slate-900 text-right">
                {course?.dosen_pengampu || '-'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Daftar Indikator & Bobot Rubrik */}
        <section className="print-break-inside-avoid space-y-2.5">
          <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">
            02. Matriks Indikator Rubrik &amp; Bobot Penilaian
          </h3>
          <table className="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="py-2 px-2.5 border border-slate-300 font-semibold">Kode</th>
                <th className="py-2 px-2.5 border border-slate-300 font-semibold">CPMK / Sub-CPMK</th>
                <th className="py-2 px-2.5 border border-slate-300 font-semibold">Instrumen</th>
                <th className="py-2 px-2.5 border border-slate-300 font-semibold">Indikator Penilaian</th>
                <th className="py-2 px-2.5 border border-slate-300 font-semibold text-right">Bobot</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind) => (
                <tr key={ind.id}>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono">{ind.kode_indikator}</td>
                  <td className="py-1.5 px-2.5 border border-slate-300">
                    {ind.cpmk} ({ind.sub_cpmk})
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300">{ind.bentuk_instrumen}</td>
                  <td className="py-1.5 px-2.5 border border-slate-300">{ind.nama_indikator}</td>
                  <td className="py-1.5 px-2.5 border border-slate-300 text-right font-mono tabular-nums">
                    {ind.bobot}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={4} className="py-1.5 px-2.5 border border-slate-300 text-right">
                  Total Bobot Keseluruhan
                </td>
                <td className="py-1.5 px-2.5 border border-slate-300 text-right font-mono tabular-nums">
                  {totalWeight}%
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. Statistik Distribusi Nilai */}
        <section className="print-break-inside-avoid space-y-2.5">
          <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">
            03. Ringkasan Statistik &amp; Distribusi Huruf Mutu
          </h3>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div className="border border-slate-300 rounded p-2.5">
              <div className="text-slate-500">Peserta Dinilai</div>
              <div className="font-mono text-base font-bold tabular-nums">{stats.totalStudents} Mhs</div>
            </div>
            <div className="border border-slate-300 rounded p-2.5">
              <div className="text-slate-500">Rata-rata Kelas</div>
              <div className="font-mono text-base font-bold tabular-nums">{stats.average.toFixed(2)}</div>
            </div>
            <div className="border border-slate-300 rounded p-2.5">
              <div className="text-slate-500">Rentang Nilai</div>
              <div className="font-mono text-base font-bold tabular-nums">
                {stats.lowest.toFixed(1)} – {stats.highest.toFixed(1)}
              </div>
            </div>
            <div className="border border-slate-300 rounded p-2.5">
              <div className="text-slate-500">Kelulusan (≥ C)</div>
              <div className="font-mono text-base font-bold tabular-nums">{stats.passRate.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-9 gap-1.5 text-center text-xs pt-1">
            {LETTER_GRADES_ORDER.map((letter) => (
              <div key={letter} className="border border-slate-300 rounded py-1.5 px-1">
                <div className="font-bold">{letter}</div>
                <div className="font-mono tabular-nums text-slate-700">{stats.distribution[letter] || 0}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Rekap Nilai Mahasiswa */}
        <section className="space-y-2.5">
          <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">
            04. Rekapitulasi Nilai Akhir &amp; Huruf Mutu Mahasiswa
          </h3>
          <table className="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="py-2 px-2.5 border border-slate-300 w-10 text-center">No</th>
                <th className="py-2 px-2.5 border border-slate-300 w-28">NIM</th>
                <th className="py-2 px-2.5 border border-slate-300">Nama Mahasiswa</th>
                {indicators.map((ind, idx) => (
                  <th
                    key={ind.id}
                    className="py-2 px-2 border border-slate-300 text-center font-mono"
                    title={ind.nama_indikator}
                  >
                    Ind.{idx + 1}
                  </th>
                ))}
                <th className="py-2 px-2.5 border border-slate-300 text-right font-semibold">Nilai Akhir</th>
                <th className="py-2 px-2.5 border border-slate-300 text-center font-semibold">Huruf</th>
              </tr>
            </thead>
            <tbody>
              {calculatedGrades.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + indicators.length}
                    className="py-4 px-3 border border-slate-300 text-center text-slate-500"
                  >
                    Belum ada data mahasiswa yang dinilai.
                  </td>
                </tr>
              ) : (
                calculatedGrades.map((g, index) => (
                  <tr key={g.studentId}>
                    <td className="py-1.5 px-2.5 border border-slate-300 text-center tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border border-slate-300 font-mono tabular-nums">
                      {g.nim}
                    </td>
                    <td className="py-1.5 px-2.5 border border-slate-300 font-medium">{g.nama}</td>
                    {indicators.map((ind) => {
                      const key = ind.kode_indikator || ind.id;
                      return (
                        <td
                          key={ind.id}
                          className="py-1.5 px-2 border border-slate-300 text-center font-mono tabular-nums"
                        >
                          {g.skorIndikator[key] ?? 0}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2.5 border border-slate-300 text-right font-mono font-bold tabular-nums">
                      {g.nilaiAkhir.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2.5 border border-slate-300 text-center font-bold">
                      {g.hurufMutu}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* 5. Refleksi Dosen */}
        <section className="print-break-inside-avoid space-y-2">
          <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">
            05. Refleksi Pelaksanaan Perkuliahan &amp; Rencana Tindak Lanjut (CQI)
          </h3>
          <div className="border border-slate-300 rounded p-3.5 text-xs leading-relaxed whitespace-pre-line text-slate-800 bg-slate-50/40">
            {reflectionText.trim() ||
              'Belum ada narasi refleksi dosen yang disusun pada Tab 3.'}
          </div>
        </section>

        {/* 6. Daftar Lampiran Bukti Portofolio */}
        <section className="print-break-inside-avoid space-y-2">
          <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-300 pb-1">
            06. Daftar Lampiran Bukti Portofolio Perkuliahan (Direct Evidence)
          </h3>
          {files.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              Belum ada berkas bukti portofolio yang diunggah.
            </p>
          ) : (
            <ul className="border border-slate-300 rounded divide-y divide-slate-200 text-xs">
              {files.map((file, idx) => (
                <li key={file.id} className="px-3 py-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-900 tabular-nums">{idx + 1}. </span>
                    <span className="font-medium text-slate-800">{file.name}</span>
                    <span className="text-slate-500"> — {CATEGORY_LABELS[file.category]}</span>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-900 hover:underline no-print shrink-0"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pengesahan */}
        <footer className="print-break-inside-avoid pt-6 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-14">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-900">
                Ketua Program Studi / Gugus Penjaminan Mutu
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 underline">
                ( ........................................................ )
              </p>
              <p className="text-slate-500">NIP. ........................................</p>
            </div>
          </div>

          <div className="space-y-14 text-left sm:pl-12">
            <div>
              <p className="text-slate-600">Ambon, {todayFormatted}</p>
              <p className="font-semibold text-slate-900">Dosen Pengampu Mata Kuliah</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 underline">
                {course?.dosen_pengampu || '( ........................................................ )'}
              </p>
              <p className="text-slate-500">NIDN / NIP.</p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
