import { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderArchive,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type {
  CalculatedStudentGrade,
  GradeStats,
  PortfolioCategory,
  PortfolioFile,
  RpsCourse,
  RubrikIndicator,
} from '../types/obe';
import { uploadPortfolioFileToStorage } from '../lib/supabase';
import { formatFileSize } from '../utils/grading';

interface Tab3PortfolioProps {
  course: RpsCourse | null;
  kelas: string;
  indicators: RubrikIndicator[];
  calculatedGrades: CalculatedStudentGrade[];
  stats: GradeStats;
  files: PortfolioFile[];
  onAddFile: (file: PortfolioFile) => void;
  onRemoveFile: (fileId: string) => void;
  reflectionText: string;
  onChangeReflection: (val: string) => void;
}

const PORTFOLIO_CATEGORIES: Array<{
  key: PortfolioCategory;
  title: string;
  subtitle: string;
  badgeText: string;
}> = [
  {
    key: 'tinggi',
    title: 'Sampel Karya/Jawaban Mahasiswa Kategori Nilai Tinggi (Terbaik)',
    subtitle: 'Unggah 1–3 sampel lembar jawaban ujian/tugas mahasiswa dengan capaian terbaik (Nilai A / ≥ 85).',
    badgeText: 'Direct Evidence · Tinggi',
  },
  {
    key: 'sedang',
    title: 'Sampel Karya/Jawaban Mahasiswa Kategori Nilai Sedang (Menengah)',
    subtitle: 'Unggah 1–3 sampel karya mahasiswa kategori capaian menengah (Nilai B / C+).',
    badgeText: 'Direct Evidence · Sedang',
  },
  {
    key: 'rendah',
    title: 'Sampel Karya/Jawaban Mahasiswa Kategori Nilai Rendah (Kurang)',
    subtitle: 'Unggah 1–3 sampel karya mahasiswa yang belum memenuhi ambang CPMK (Nilai D / E).',
    badgeText: 'Direct Evidence · Rendah',
  },
  {
    key: 'bap',
    title: 'Berita Acara Perkuliahan (BAP) & Rekap Presensi',
    subtitle: 'Unggah dokumen Berita Acara Perkuliahan, daftar hadir kelas, serta bukti verifikasi pertemuan.',
    badgeText: 'Administrasi Mutu · BAP',
  },
];

export function Tab3Portfolio({
  course,
  kelas,
  indicators,
  calculatedGrades,
  stats,
  files,
  onAddFile,
  onRemoveFile,
  reflectionText,
  onChangeReflection,
}: Tab3PortfolioProps) {
  const [uploadingCategory, setUploadingCategory] = useState<PortfolioCategory | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleFileUpload = async (
    category: PortfolioCategory,
    fileList: FileList | null
  ) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploadingCategory(category);

    try {
      const rpsId = course?.id || 'draft-rps';
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadPortfolioFileToStorage({
          file,
          rpsId,
          kelas,
          category,
        });
        onAddFile(uploaded);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah berkas.'
      );
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleGenerateReflection = async () => {
    setAiError(null);
    setIsGeneratingAi(true);

    try {
      const cpmkKeys = Array.from(new Set(indicators.map((i) => i.cpmk || 'CPMK-1')));
      const cpmkPerformance = cpmkKeys.map((cpmkKey) => {
        const indCount = indicators.filter((i) => (i.cpmk || 'CPMK-1') === cpmkKey).length;
        const avg =
          calculatedGrades.length > 0
            ? calculatedGrades.reduce(
                (acc, g) => acc + (g.skorPerCpmk[cpmkKey]?.percentage || 0),
                0
              ) / calculatedGrades.length
            : 0;
        return {
          cpmk: cpmkKey,
          averageScore: avg,
          indicatorCount: indCount,
        };
      });

      const evidenceSummary = {
        tinggi: files.filter((f) => f.category === 'tinggi').length,
        sedang: files.filter((f) => f.category === 'sedang').length,
        rendah: files.filter((f) => f.category === 'rendah').length,
        bap: files.filter((f) => f.category === 'bap').length,
      };

      const response = await fetch('/api/generate-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: course
            ? {
                kode_mk: course.kode_mk,
                nama_mk: course.nama_mk,
                prodi: course.prodi,
                tahun_akademik: course.tahun_akademik,
                dosen_pengampu: course.dosen_pengampu,
              }
            : {},
          kelas,
          totalStudents: calculatedGrades.length,
          stats,
          cpmkPerformance,
          evidenceSummary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghubungi layanan AI.');
      }

      onChangeReflection(data.reflection || '');
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Gagal menghasilkan ringkasan refleksi AI.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const completedCategoriesCount = PORTFOLIO_CATEGORIES.filter((cat) =>
    files.some((f) => f.category === cat.key)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Repositori */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Repositori Bukti Portofolio Mata Kuliah (Direct Evidence Akreditasi)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah berkas PDF, JPG, PNG, atau DOCX ke Supabase Storage bucket <code className="font-mono bg-slate-100 px-1 rounded">obe-portofolio</code> dengan jalur terstruktur <code className="font-mono bg-slate-100 px-1 rounded">/{course?.id || 'rps_id'}/{kelas.replace(/\s+/g, '_')}/...</code>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 whitespace-nowrap self-start sm:self-auto tabular-nums">
            <FolderArchive className="w-4 h-4 text-blue-900" />
            <span>Kelengkapan Kategori: {completedCategoriesCount} / 4</span>
          </div>
        </div>

        {uploadError && (
          <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {uploadError}
          </div>
        )}

        {/* 4 Kategori Wajib */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PORTFOLIO_CATEGORIES.map((category) => {
            const categoryFiles = files.filter((f) => f.category === category.key);
            const isUploading = uploadingCategory === category.key;

            return (
              <div
                key={category.key}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-blue-900">
                      {category.badgeText}
                    </span>
                    {categoryFiles.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{categoryFiles.length} berkas</span>
                      </span>
                    )}
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 leading-snug">
                    {category.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{category.subtitle}</p>
                </div>

                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-blue-800 bg-white hover:bg-blue-50/30 rounded-lg py-4 px-3 transition-colors cursor-pointer text-center">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 text-blue-900 animate-spin" />
                        <span className="text-xs font-semibold text-blue-900">
                          Mengunggah berkas ke bucket obe-portofolio...
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-800">
                          Klik untuk pilih berkas (PDF, JPG, PNG, DOCX)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      disabled={isUploading}
                      onChange={(e) => {
                        void handleFileUpload(category.key, e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>

                  {categoryFiles.length > 0 && (
                    <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                      {categoryFiles.map((file) => (
                        <li
                          key={file.id}
                          className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-blue-900 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 truncate">{file.name}</div>
                              <div className="text-[11px] text-slate-500 tabular-nums">
                                {formatFileSize(file.size)}
                                {file.isLocalDemo ? ' · Pratinjau Lokal' : ' · Supabase Storage'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.name}
                              title="Pratinjau / Unduh berkas"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:border-blue-800 text-slate-700 hover:text-blue-900 font-medium transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Pratinjau</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => onRemoveFile(file.id)}
                              title="Hapus berkas"
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fitur AI Gemini: Ringkasan Refleksi Portofolio Dosen */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Narasi Refleksi &amp; Evaluasi Pelaksanaan Perkuliahan Dosen
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Susun evaluasi kendala pembelajaran, analisis ketercapaian CPMK, dan rencana perbaikan mutu (CQI) berdasarkan data buku nilai kelas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateReflection}
            disabled={isGeneratingAi}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyusun Refleksi Portofolio...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>✨ Generate Ringkasan Refleksi Portofolio Dosen</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {aiError}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="refleksi-textarea" className="block text-xs font-semibold text-slate-700">
            Draf Evaluasi &amp; Refleksi Dosen (Dapat disunting sebelum cetak &amp; simpan)
          </label>
          <textarea
            id="refleksi-textarea"
            rows={9}
            value={reflectionText}
            onChange={(e) => onChangeReflection(e.target.value)}
            placeholder="Klik tombol 'Generate Ringkasan Refleksi Portofolio Dosen' di atas untuk menyusun draf narasi otomatis dari sebaran nilai kelas, atau tulis evaluasi perkuliahan Anda secara langsung di sini..."
            className="w-full rounded-lg border border-slate-300 p-3.5 text-sm text-slate-900 leading-relaxed focus:border-blue-800 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
