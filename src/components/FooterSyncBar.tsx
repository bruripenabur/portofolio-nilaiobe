import { ArrowRight, CheckCircle2, Loader2, Save } from 'lucide-react';

interface FooterSyncBarProps {
  studentCount: number;
  indicatorCount: number;
  evidenceCount: number;
  isSaving: boolean;
  onSaveAndContinue: () => void;
}

export function FooterSyncBar({
  studentCount,
  indicatorCount,
  evidenceCount,
  isSaving,
  onSaveAndContinue,
}: FooterSyncBarProps) {
  return (
    <div className="bg-slate-900 text-white border-t-2 border-amber-500 rounded-xl p-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sinkronisasi Siklus OBE &amp; Estafet ke Modul 5 (Pengukuran CPL)</span>
        </div>
        <p className="text-xs text-slate-300 tabular-nums">
          Ringkasan kesiapan: {studentCount} Mahasiswa · {indicatorCount} Indikator Rubrik · {evidenceCount} Berkas Portofolio
        </p>
      </div>

      <button
        type="button"
        onClick={onSaveAndContinue}
        disabled={isSaving}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 shadow-sm"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyimpan ke Supabase...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Simpan Buku Nilai &amp; Portofolio, Lanjut ke Pengukuran CPL</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
