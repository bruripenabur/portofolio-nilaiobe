import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FolderArchive,
  Users,
  X,
} from 'lucide-react';
import { AddIndicatorModal } from './components/AddIndicatorModal';
import { CourseContextStrip } from './components/CourseContextStrip';
import { FooterSyncBar } from './components/FooterSyncBar';
import { Tab1ClassManagement } from './components/Tab1ClassManagement';
import { Tab2Gradebook } from './components/Tab2Gradebook';
import { Tab3Portfolio } from './components/Tab3Portfolio';
import { Tab4PrintPreview } from './components/Tab4PrintPreview';
import { TopBar } from './components/TopBar';
import {
  DEMO_INITIAL_SCORES,
  DEMO_RPS_COURSES,
  DEMO_RUBRIK_BY_RPS,
  DEMO_STUDENTS,
} from './data/demoData';
import {
  MODUL_5_URL,
  fetchRpsAndRubrik,
  fetchRpsList,
  isSupabaseConfigured,
  savePortfolioAndSync,
} from './lib/supabase';
import type {
  DaftarNilaiRubrikPayload,
  DokumenPortofolioPayload,
  PortfolioFile,
  RpsCourse,
  RubrikIndicator,
  ScoreMap,
  ScoringScaleMode,
  Student,
} from './types/obe';
import { calculateClassStats, calculateStudentGrades } from './utils/grading';

type ActiveTab = 'tab1' | 'tab2' | 'tab3' | 'tab4';

interface SyncResultDialog {
  id: string;
  redirectUrl: string;
  isSimulated: boolean;
  isPlaceholderTarget: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tab2');

  const [courses, setCourses] = useState<RpsCourse[]>([]);
  const [selectedRpsId, setSelectedRpsId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<RpsCourse | null>(null);
  const [indicators, setIndicators] = useState<RubrikIndicator[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);

  const [kelas, setKelas] = useState<string>('Kelas A');
  const [tahunAkademik, setTahunAkademik] = useState<string>('2025/2026 - Ganjil');

  const [students, setStudents] = useState<Student[]>(DEMO_STUDENTS);
  const [scores, setScores] = useState<ScoreMap>(
    DEMO_INITIAL_SCORES[DEMO_RPS_COURSES[0].id] || {}
  );
  const [scaleMode, setScaleMode] = useState<ScoringScaleMode>('raw_100');

  const [portfolioFiles, setPortfolioFiles] = useState<PortfolioFile[]>([]);
  const [reflectionText, setReflectionText] = useState<string>('');

  const [isAddIndicatorOpen, setIsAddIndicatorOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<SyncResultDialog | null>(null);

  const loadCourseDetails = useCallback(async (rpsId: string, courseList: RpsCourse[]) => {
    if (!rpsId) return;
    setFetchNotice(null);

    const matchedInList = courseList.find((c) => c.id === rpsId) || null;

    if (isSupabaseConfigured) {
      const { rps, rubrik, error } = await fetchRpsAndRubrik(rpsId);
      if (error) {
        setFetchNotice(
          `Catatan koneksi Supabase: ${error}. Menampilkan data cadangan apabila tersedia.`
        );
      }
      const activeCourse = rps || matchedInList;
      if (activeCourse) {
        setSelectedCourse(activeCourse);
        setTahunAkademik(activeCourse.tahun_akademik || '2025/2026 - Ganjil');
      }
      if (rubrik.length > 0) {
        setIndicators(rubrik);
      } else {
        setIndicators(DEMO_RUBRIK_BY_RPS[rpsId] || []);
      }
    } else {
      const demoCourse =
        matchedInList ||
        DEMO_RPS_COURSES.find((c) => c.id === rpsId) ||
        DEMO_RPS_COURSES[0];
      setSelectedCourse(demoCourse);
      setTahunAkademik(demoCourse.tahun_akademik);
      setIndicators(DEMO_RUBRIK_BY_RPS[demoCourse.id] || []);
      if (DEMO_INITIAL_SCORES[demoCourse.id]) {
        setScores(DEMO_INITIAL_SCORES[demoCourse.id]);
      } else {
        setScores({});
      }
    }
  }, []);

  const loadInitialCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    setFetchNotice(null);

    const urlParams = new URLSearchParams(window.location.search);
    const paramRpsId = urlParams.get('rps_id');

    try {
      const res = await fetchRpsList();
      let availableCourses: RpsCourse[] = [];

      if (res.fromSupabase && !res.error && res.data.length > 0) {
        availableCourses = res.data;
      } else {
        if (res.error) {
          setFetchNotice(
            `Koneksi Supabase gagal (${res.error}). Menggunakan daftar mata kuliah contoh.`
          );
        }
        availableCourses = DEMO_RPS_COURSES;
      }

      setCourses(availableCourses);

      const initialId =
        paramRpsId && availableCourses.some((c) => c.id === paramRpsId)
          ? paramRpsId
          : paramRpsId || availableCourses[0]?.id || '';

      setSelectedRpsId(initialId);
      if (initialId) {
        await loadCourseDetails(initialId, availableCourses);
      }
    } finally {
      setIsLoadingCourses(false);
    }
  }, [loadCourseDetails]);

  useEffect(() => {
    void loadInitialCourses();
  }, [loadInitialCourses]);

  const handleSelectCourse = async (rpsId: string) => {
    setSelectedRpsId(rpsId);
    await loadCourseDetails(rpsId, courses);
  };

  const handleAddStudents = (newEntries: Array<{ nim: string; nama: string }>) => {
    const existingNims = new Set(students.map((s) => s.nim.toLowerCase()));
    let added = 0;
    let skipped = 0;
    const toAppend: Student[] = [];

    newEntries.forEach((entry) => {
      const normalizedNim = entry.nim.trim();
      if (!normalizedNim || !entry.nama.trim()) return;
      if (existingNims.has(normalizedNim.toLowerCase())) {
        skipped += 1;
        return;
      }
      existingNims.add(normalizedNim.toLowerCase());
      toAppend.push({
        id: `stu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        nim: normalizedNim,
        nama: entry.nama.trim(),
      });
      added += 1;
    });

    if (toAppend.length > 0) {
      setStudents((prev) => [...prev, ...toAppend]);
    }

    return { added, skipped };
  };

  const handleRemoveStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleClearStudents = () => {
    setStudents([]);
    setScores({});
  };

  const handleLoadDemoStudents = () => {
    setStudents(DEMO_STUDENTS);
    if (selectedRpsId && DEMO_INITIAL_SCORES[selectedRpsId]) {
      setScores(DEMO_INITIAL_SCORES[selectedRpsId]);
    }
  };

  const handleScoreChange = (studentId: string, indicatorId: string, value: number | null) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [indicatorId]: value,
      },
    }));
  };

  const handleAddManualIndicator = (indicator: RubrikIndicator) => {
    setIndicators((prev) => [...prev, indicator]);
  };

  const handleDeleteIndicator = (id: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddPortfolioFile = (file: PortfolioFile) => {
    setPortfolioFiles((prev) => [...prev, file]);
  };

  const handleRemovePortfolioFile = (fileId: string) => {
    setPortfolioFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const calculatedGrades = useMemo(
    () => calculateStudentGrades(students, indicators, scores),
    [students, indicators, scores]
  );

  const classStats = useMemo(() => calculateClassStats(calculatedGrades), [calculatedGrades]);

  const handleSaveAndContinue = async () => {
    setSaveError(null);

    if (!selectedRpsId) {
      setSaveError('Pilih Mata Kuliah / RPS terlebih dahulu sebelum menyimpan.');
      return;
    }

    if (students.length === 0) {
      setSaveError('Daftar mahasiswa masih kosong. Tambahkan mahasiswa pada Tab 1 terlebih dahulu.');
      setActiveTab('tab1');
      return;
    }

    setIsSaving(true);
    try {
      const daftarNilaiRubrik: DaftarNilaiRubrikPayload[] = calculatedGrades.map((g) => ({
        nim: g.nim,
        nama: g.nama,
        skor_indikator: g.skorIndikator,
        nilai_akhir: g.nilaiAkhir,
        huruf_mutu: g.hurufMutu,
      }));

      const mapByCategory = (cat: PortfolioFile['category']) =>
        portfolioFiles
          .filter((f) => f.category === cat)
          .map((f) => ({
            name: f.name,
            url: f.url,
            path: f.storagePath,
            uploaded_at: f.uploadedAt,
          }));

      const dokumenPortofolio: DokumenPortofolioPayload = {
        bukti_tinggi: mapByCategory('tinggi'),
        bukti_sedang: mapByCategory('sedang'),
        bukti_rendah: mapByCategory('rendah'),
        bap_presensi: mapByCategory('bap'),
        refleksi_dosen: reflectionText,
      };

      const result = await savePortfolioAndSync({
        rps_id: selectedRpsId,
        kelas: kelas.trim() || 'Kelas A',
        tahun_akademik: tahunAkademik.trim() || selectedCourse?.tahun_akademik || '2025/2026',
        daftar_nilai_rubrik: daftarNilaiRubrik,
        dokumen_portofolio: dokumenPortofolio,
      });

      const isPlaceholderTarget =
        MODUL_5_URL.includes('[MASUKKAN_URL') ||
        (!MODUL_5_URL.startsWith('http://') && !MODUL_5_URL.startsWith('https://') && !MODUL_5_URL.startsWith('/'));

      setSyncSuccess({
        id: result.id,
        redirectUrl: result.redirectUrl,
        isSimulated: result.isSimulated,
        isPlaceholderTarget,
      });

      if (!result.isSimulated && !isPlaceholderTarget) {
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 1200);
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Gagal menyimpan buku nilai & portofolio.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: typeof Users;
    badge?: string;
  }> = [
    {
      id: 'tab1',
      label: '1. Manajemen Kelas & Mahasiswa',
      shortLabel: '1. Kelas & Mhs',
      icon: Users,
      badge: String(students.length),
    },
    {
      id: 'tab2',
      label: '2. Buku Nilai Berbasis Rubrik',
      shortLabel: '2. Buku Nilai',
      icon: Calculator,
      badge: `${indicators.length} Ind`,
    },
    {
      id: 'tab3',
      label: '3. Repositori Portofolio & Refleksi AI',
      shortLabel: '3. Portofolio',
      icon: FolderArchive,
      badge: String(portfolioFiles.length),
    },
    {
      id: 'tab4',
      label: '4. Pratinjau & Cetak Portofolio',
      shortLabel: '4. Cetak Laporan',
      icon: FileCheck2,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        courses={courses}
        selectedRpsId={selectedRpsId}
        onSelectCourse={handleSelectCourse}
        onRefreshCourses={() => void loadInitialCourses()}
        isLoadingCourses={isLoadingCourses}
        isSupabaseConnected={isSupabaseConfigured}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        <CourseContextStrip
          course={selectedCourse}
          indicators={indicators}
          kelas={kelas}
          tahunAkademik={tahunAkademik}
          isSupabaseConnected={isSupabaseConfigured}
          fetchNotice={fetchNotice}
          onOpenAddIndicator={() => setIsAddIndicatorOpen(true)}
          onDeleteIndicator={handleDeleteIndicator}
        />

        {/* 4-Tab Workflow Navigation */}
        <nav
          aria-label="Navigasi Modul 4 SIMPEL-OBE"
          className="bg-white border border-slate-200 rounded-xl p-1.5 grid grid-cols-2 lg:grid-cols-4 gap-1.5 no-print"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:justify-between gap-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="hidden md:inline truncate">{tab.label}</span>
                  <span className="md:hidden truncate">{tab.shortLabel}</span>
                </span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Error Notification */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-red-900 no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="p-1 text-red-700 hover:text-red-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Tab Viewport */}
        <div>
          {activeTab === 'tab1' && (
            <Tab1ClassManagement
              kelas={kelas}
              onChangeKelas={setKelas}
              tahunAkademik={tahunAkademik}
              onChangeTahunAkademik={setTahunAkademik}
              students={students}
              onAddStudents={handleAddStudents}
              onRemoveStudent={handleRemoveStudent}
              onClearStudents={handleClearStudents}
              onLoadDemoStudents={handleLoadDemoStudents}
            />
          )}

          {activeTab === 'tab2' && (
            <Tab2Gradebook
              students={students}
              indicators={indicators}
              scores={scores}
              calculatedGrades={calculatedGrades}
              stats={classStats}
              scaleMode={scaleMode}
              onChangeScaleMode={setScaleMode}
              onScoreChange={handleScoreChange}
              onOpenAddIndicator={() => setIsAddIndicatorOpen(true)}
              onDeleteIndicator={handleDeleteIndicator}
            />
          )}

          {activeTab === 'tab3' && (
            <Tab3Portfolio
              course={selectedCourse}
              kelas={kelas}
              indicators={indicators}
              calculatedGrades={calculatedGrades}
              stats={classStats}
              files={portfolioFiles}
              onAddFile={handleAddPortfolioFile}
              onRemoveFile={handleRemovePortfolioFile}
              reflectionText={reflectionText}
              onChangeReflection={setReflectionText}
            />
          )}

          {activeTab === 'tab4' && (
            <Tab4PrintPreview
              course={selectedCourse}
              kelas={kelas}
              tahunAkademik={tahunAkademik}
              indicators={indicators}
              calculatedGrades={calculatedGrades}
              stats={classStats}
              files={portfolioFiles}
              reflectionText={reflectionText}
            />
          )}
        </div>

        <FooterSyncBar
          studentCount={students.length}
          indicatorCount={indicators.length}
          evidenceCount={portfolioFiles.length}
          isSaving={isSaving}
          onSaveAndContinue={() => void handleSaveAndContinue()}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-center text-xs text-slate-500 no-print">
        Portal Ekosistem Digital OBE · Pusat Kurikulum dan Inovasi Pembelajaran — Universitas Pattimura
      </footer>

      <AddIndicatorModal
        isOpen={isAddIndicatorOpen}
        rpsId={selectedRpsId || 'draft-rps'}
        existingCount={indicators.length}
        onClose={() => setIsAddIndicatorOpen(false)}
        onAdd={handleAddManualIndicator}
      />

      {/* Modal Sukses Simpan & Estafet Modul 5 */}
      {syncSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Buku Nilai &amp; Portofolio Berhasil Disimpan
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {syncSuccess.isSimulated
                    ? 'Simulasi penyimpanan berhasil (Supabase belum dikonfigurasi). Status siklus siap diperbarui ke 4_nilai_selesai.'
                    : 'Data telah di-upsert ke tabel obe_portofolio_nilai dan status_siklus pada obe_rps telah diperbarui menjadi 4_nilai_selesai.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">ID Portofolio:</span>
                <span className="font-mono font-semibold text-slate-900">{syncSuccess.id}</span>
              </div>
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <span className="text-slate-500 block">URL Estafet Modul 5 (Pengukuran CPL):</span>
                <code className="block font-mono text-[11px] bg-white border border-slate-200 rounded p-2 text-blue-900 break-all">
                  {syncSuccess.redirectUrl}
                </code>
              </div>
            </div>

            {syncSuccess.isPlaceholderTarget && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Konstanta <code className="font-mono">MODUL_5_URL</code> di <code className="font-mono">src/lib/supabase.ts</code> masih berupa placeholder. Setelah Anda menggantinya dengan URL Modul 5 yang aktif, sistem akan otomatis mengarahkan halaman ke URL tersebut.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSyncSuccess(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = syncSuccess.redirectUrl;
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-amber-300 cursor-pointer"
              >
                <span>Buka Modul 5 Sekarang</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
