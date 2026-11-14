import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { RubrikIndicator } from '../types/obe';

interface AddIndicatorModalProps {
  isOpen: boolean;
  rpsId: string;
  existingCount: number;
  onClose: () => void;
  onAdd: (indicator: RubrikIndicator) => void;
}

export function AddIndicatorModal({
  isOpen,
  rpsId,
  existingCount,
  onClose,
  onAdd,
}: AddIndicatorModalProps) {
  const [namaIndikator, setNamaIndikator] = useState('');
  const [bentukInstrumen, setBentukInstrumen] = useState('Tugas Terstruktur');
  const [cpmk, setCpmk] = useState('CPMK-1');
  const [subCpmk, setSubCpmk] = useState('Sub-CPMK 1.1');
  const [bobot, setBobot] = useState('15');
  const [kriteria, setKriteria] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaIndikator.trim()) return;

    const indexNum = existingCount + 1;
    const newIndicator: RubrikIndicator = {
      id: `manual_${Date.now()}`,
      rps_id: rpsId,
      kode_indikator: `indikator_${indexNum}`,
      nama_indikator: namaIndikator.trim(),
      bentuk_instrumen: bentukInstrumen.trim() || 'Asesmen Mandiri',
      cpmk: cpmk.trim() || 'CPMK-1',
      sub_cpmk: subCpmk.trim() || `Sub-CPMK ${indexNum}`,
      bobot: Math.max(1, Math.min(100, Number(bobot) || 10)),
      kriteria_deskripsi: kriteria.trim() || undefined,
      is_manual: true,
    };

    onAdd(newIndicator);
    setNamaIndikator('');
    setKriteria('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Tambah Indikator Penilaian Manual
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Opsi fallback mandiri apabila dosen ingin menambah kolom indikator di luar rubrik Modul 3.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Indikator / Kriteria Penilaian
            </label>
            <input
              type="text"
              required
              value={namaIndikator}
              onChange={(e) => setNamaIndikator(e.target.value)}
              placeholder="Contoh: Ketepatan Analisis Studi Kasus Lapangan"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bentuk Instrumen
              </label>
              <select
                value={bentukInstrumen}
                onChange={(e) => setBentukInstrumen(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-800 focus:outline-none"
              >
                <option value="Tugas Terstruktur">Tugas Terstruktur</option>
                <option value="Kuis">Kuis</option>
                <option value="UTS">Ujian Tengah Semester (UTS)</option>
                <option value="UAS">Ujian Akhir Semester (UAS)</option>
                <option value="Proyek / Praktikum">Proyek / Praktikum</option>
                <option value="Observasi Partisipatif">Observasi Partisipatif</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bobot Penilaian (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={bobot}
                onChange={(e) => setBobot(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode CPMK Terkait
              </label>
              <input
                type="text"
                value={cpmk}
                onChange={(e) => setCpmk(e.target.value)}
                placeholder="CPMK-1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Sub-CPMK
              </label>
              <input
                type="text"
                value={subCpmk}
                onChange={(e) => setSubCpmk(e.target.value)}
                placeholder="Sub-CPMK 1.1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Kriteria Rubrik (Opsional)
            </label>
            <textarea
              rows={2}
              value={kriteria}
              onChange={(e) => setKriteria(e.target.value)}
              placeholder="Ringkasan deskripsi rubrik penilaian..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Tambahkan ke Buku Nilai</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
