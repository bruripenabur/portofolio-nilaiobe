import { useRef, useState } from 'react';
import {
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Student } from '../types/obe';
import { buildStudentCsvTemplate, parsePastedStudents } from '../utils/grading';

interface Tab1ClassManagementProps {
  kelas: string;
  onChangeKelas: (val: string) => void;
  tahunAkademik: string;
  onChangeTahunAkademik: (val: string) => void;
  dosenPengampu: string;
  onChangeDosenPengampu: (val: string) => void;
  prodi: string;
  onChangeProdi: (val: string) => void;
  students: Student[];
  onAddStudents: (newStudents: Array<{ nim: string; nama: string }>) => {
    added: number;
    skipped: number;
  };
  onRemoveStudent: (id: string) => void;
  onClearStudents: () => void;
  onLoadDemoStudents: () => void;
}

export function Tab1ClassManagement({
  kelas,
  onChangeKelas,
  tahunAkademik,
  onChangeTahunAkademik,
  dosenPengampu,
  onChangeDosenPengampu,
  prodi,
  onChangeProdi,
  students,
  onAddStudents,
  onRemoveStudent,
  onClearStudents,
  onLoadDemoStudents,
}: Tab1ClassManagementProps) {
  const [nimInput, setNimInput] = useState('');
  const [namaInput, setNamaInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const nim = nimInput.trim();
    const nama = namaInput.trim();
    if (!nim || !nama) {
      setFeedback('Mohon lengkapi NIM dan Nama Lengkap mahasiswa.');
      return;
    }
    const result = onAddStudents([{ nim, nama }]);
    if (result.added > 0) {
      setNimInput('');
      setNamaInput('');
      setFeedback(`Mahasiswa ${nama} (${nim}) berhasil ditambahkan.`);
    } else {
      setFeedback(`NIM ${nim} sudah ada dalam daftar kelas.`);
    }
  };

  const handleConfirmPaste = () => {
    const parsed = parsePastedStudents(pasteText);
    if (parsed.length === 0) {
      setFeedback('Tidak ditemukan baris valid. Pastikan format: NIM [Tab] Nama Lengkap.');
      return;
    }
    const result = onAddStudents(parsed);
    setPasteText('');
    setShowPasteModal(false);
    setFeedback(
      `Impor selesai: ${result.added} mahasiswa ditambahkan${
        result.skipped > 0 ? `, ${result.skipped} NIM duplikat dilewati` : ''
      }.`
    );
  };

  const handleDownloadTemplate = () => {
    const csvContent = buildStudentCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_mahasiswa_simpel_obe.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const parsed = parsePastedStudents(text);
      if (parsed.length === 0) {
        setFeedback('File CSV kosong atau format kolom tidak sesuai (gunakan NIM,Nama Lengkap).');
      } else {
        const result = onAddStudents(parsed);
        setFeedback(
          `CSV diproses: ${result.added} mahasiswa diimpor${
            result.skipped > 0 ? `, ${result.skipped} NIM duplikat dilewati` : ''
          }.`
        );
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return s.nim.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q);
  });

  const pastedPreview = parsePastedStudents(pasteText);

  return (
    <div className="space-y-6">
      {/* Identitas Kelas */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Identitas Kelas &amp; Periode Akademik
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan nama kelas dan tahun akademik untuk pengelompokan buku nilai serta folder portofolio.
            </p>
          </div>
          <span className="text-xs font-medium text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md self-start sm:self-auto tabular-nums">
            Total Terdaftar: {students.length} Mahasiswa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <label htmlFor="input-kelas" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kelas
            </label>
            <div className="flex gap-2">
              <input
                id="input-kelas"
                type="text"
                value={kelas}
                onChange={(e) => onChangeKelas(e.target.value)}
                placeholder="Misal: Kelas A"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {['Kelas A', 'Kelas B', 'Kelas C'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeKelas(preset)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      kelas === preset
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset.replace('Kelas ', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="input-ta" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tahun Akademik / Semester
            </label>
            <input
              id="input-ta"
              type="text"
              value={tahunAkademik}
              onChange={(e) => onChangeTahunAkademik(e.target.value)}
              placeholder="Misal: 2025/2026 - Ganjil"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="input-dosen" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Dosen Pengampu
            </label>
            <input
              id="input-dosen"
              type="text"
              value={dosenPengampu}
              onChange={(e) => onChangeDosenPengampu(e.target.value)}
              placeholder="Diisi otomatis dari profil SSO"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="input-prodi" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Program Studi
            </label>
            <input
              id="input-prodi"
              type="text"
              value={prodi}
              onChange={(e) => onChangeProdi(e.target.value)}
              placeholder="Diisi otomatis dari profil SSO"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Input & Impor Mahasiswa */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Daftar Mahasiswa Peserta Kuliah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambahkan mahasiswa secara manual, tempel langsung dari Microsoft Excel, atau unggah berkas CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Massal dari Excel</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-blue-900" />
              <span>Impor CSV Mahasiswa</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template CSV</span>
            </button>
          </div>
        </div>

        {/* Form Tambah Satu per Satu */}
        <form
          onSubmit={handleAddSingle}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 border border-slate-200 rounded-lg p-3.5"
        >
          <div className="sm:col-span-4">
            <label htmlFor="add-nim" className="block text-xs font-medium text-slate-700 mb-1">
              NIM Mahasiswa
            </label>
            <input
              id="add-nim"
              type="text"
              value={nimInput}
              onChange={(e) => setNimInput(e.target.value)}
              placeholder="Contoh: 202351007"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-5">
            <label htmlFor="add-nama" className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="add-nama"
              type="text"
              value={namaInput}
              onChange={(e) => setNamaInput(e.target.value)}
              placeholder="Contoh: Gabriel Soumokil"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Tambah Mahasiswa</span>
            </button>
          </div>
        </form>

        {feedback && (
          <div className="px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-blue-700 hover:text-blue-950 font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter & Table */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIM atau nama mahasiswa..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {students.length === 0 && (
              <button
                type="button"
                onClick={onLoadDemoStudents}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Muat Sampel Mahasiswa</span>
              </button>
            )}
            {students.length > 0 && (
              <button
                type="button"
                onClick={onClearStudents}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Daftar</span>
              </button>
            )}
          </div>
        </div>

        {students.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">
              Belum Ada Mahasiswa Terdaftar di {kelas}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tambahkan mahasiswa melalui form di atas, tempel data dari Excel, atau unggah berkas CSV untuk mulai mengisi Buku Nilai.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-white text-xs">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-14 text-center">No</th>
                  <th className="py-2.5 px-4 font-semibold w-44">NIM</th>
                  <th className="py-2.5 px-4 font-semibold">Nama Lengkap Mahasiswa</th>
                  <th className="py-2.5 px-4 font-semibold w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 text-center text-xs text-slate-500 tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs sm:text-sm font-medium text-slate-800 tabular-nums">
                      {student.nim}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-medium">{student.nama}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveStudent(student.id)}
                        title={`Hapus ${student.nama}`}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Paste Massal dari Excel */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Paste Massal Daftar Mahasiswa dari Excel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin dua kolom (NIM dan Nama) langsung dari Excel/Google Sheets lalu tempel di area bawah ini. Format: <code className="font-mono bg-slate-100 px-1 rounded">NIM [Tab] Nama Lengkap</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <textarea
              rows={7}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'202351001\tAdrian Pattinaya\n202351002\tBeatrice Latuheru\n202351003\tChandra Tehupuring'}
              className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
            />

            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span>
                Baris terdeteksi siap impor: <strong className="text-slate-900 tabular-nums">{pastedPreview.length}</strong> mahasiswa
              </span>
              {pastedPreview.length > 0 && (
                <span className="truncate max-w-xs text-slate-500">
                  Contoh: {pastedPreview[0].nim} — {pastedPreview[0].nama}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPaste}
                disabled={pastedPreview.length === 0}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-blue-900 text-white disabled:opacity-50 cursor-pointer"
              >
                Impor {pastedPreview.length} Mahasiswa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
