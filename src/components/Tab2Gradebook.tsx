import { useState } from 'react';
import { AlertCircle, Calculator, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import type {
  CalculatedStudentGrade,
  GradeStats,
  LetterGrade,
  RubrikIndicator,
  ScoreMap,
  ScoringScaleMode,
  Student,
} from '../types/obe';
import {
  GRADE_SCALE_LEGEND,
  LETTER_GRADES_ORDER,
  rubricLevelToScore,
  scoreToRubricLevel,
} from '../utils/grading';
import { GradeDistributionChart } from './GradeDistributionChart';

interface Tab2GradebookProps {
  students: Student[];
  indicators: RubrikIndicator[];
  scores: ScoreMap;
  calculatedGrades: CalculatedStudentGrade[];
  stats: GradeStats;
  scaleMode: ScoringScaleMode;
  onChangeScaleMode: (mode: ScoringScaleMode) => void;
  onScoreChange: (studentId: string, indicatorId: string, value: number | null) => void;
  onOpenAddIndicator: () => void;
  onDeleteIndicator: (id: string) => void;
}

function getLetterBadgeStyle(grade: LetterGrade): string {
  switch (grade) {
    case 'A':
    case 'A-':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'B+':
    case 'B':
    case 'B-':
      return 'bg-blue-50 text-blue-900 border-blue-200';
    case 'C+':
    case 'C':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'D':
    case 'E':
      return 'bg-red-50 text-red-800 border-red-200';
  }
}

export function Tab2Gradebook({
  students,
  indicators,
  scores,
  calculatedGrades,
  stats,
  scaleMode,
  onChangeScaleMode,
  onScoreChange,
  onOpenAddIndicator,
  onDeleteIndicator,
}: Tab2GradebookProps) {
  const [showCpmkColumns, setShowCpmkColumns] = useState(true);

  const totalWeight = indicators.reduce((sum, i) => sum + (Number(i.bobot) || 0), 0);
  const uniqueCpmks = Array.from(new Set(indicators.map((i) => i.cpmk || 'CPMK-1')));

  const gradeLookup = new Map<string, CalculatedStudentGrade>();
  calculatedGrades.forEach((g) => gradeLookup.set(g.studentId, g));

  return (
    <div className="space-y-6">
      {/* Statistik Kelas Ringkas */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Rata-rata Kelas</div>
            <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {stats.average.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              Dari {stats.totalStudents} mahasiswa
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Nilai Tertinggi</div>
            <div className="font-display text-2xl font-bold text-emerald-700 tabular-nums mt-1">
              {stats.highest.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Skor akhir tertinggi</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Nilai Terendah</div>
            <div className="font-display text-2xl font-bold text-amber-700 tabular-nums mt-1">
              {stats.lowest.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Skor akhir terendah</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Tingkat Kelulusan (≥ C)</div>
            <div className="font-display text-2xl font-bold text-blue-900 tabular-nums mt-1">
              {stats.passRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ambang batas nilai ≥ 55</div>
          </div>
        </div>

        {/* Distribusi Huruf Mutu */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Distribusi Huruf Mutu Kelas
            </span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              Total Bobot Indikator: {totalWeight}%
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            {LETTER_GRADES_ORDER.map((letter) => {
              const count = stats.distribution[letter] || 0;
              const pct =
                stats.totalStudents > 0
                  ? Math.round((count / stats.totalStudents) * 100)
                  : 0;
              return (
                <div
                  key={letter}
                  className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white flex flex-col items-center text-center"
                >
                  <span className="text-xs font-bold text-slate-900">{letter}</span>
                  <span className="font-mono text-sm font-semibold text-blue-900 tabular-nums mt-0.5">
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik Batang Interaktif Recharts */}
        <GradeDistributionChart calculatedGrades={calculatedGrades} stats={stats} />
      </div>

      {/* Toolbar Buku Nilai */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:px-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => onChangeScaleMode('raw_100')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  scaleMode === 'raw_100'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Skor Mentah (0–100)
              </button>
              <button
                type="button"
                onClick={() => onChangeScaleMode('rubric_4')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  scaleMode === 'rubric_4'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Gradasi Rubrik (1–4 → 0–100)
              </button>
            </div>

            {scaleMode === 'rubric_4' && (
              <span className="text-[11px] text-slate-600">
                Skala otomatis: 1 = 25 (Kurang) · 2 = 50 (Cukup) · 3 = 75 (Baik) · 4 = 100 (Sangat Baik)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCpmkColumns((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                showCpmkColumns
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCpmkColumns ? 'Sembunyikan Kolom CPMK' : 'Tampilkan Skor per CPMK'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddIndicator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Indikator Penilaian</span>
            </button>
          </div>
        </div>

        {totalWeight !== 100 && indicators.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Total bobot seluruh indikator saat ini adalah <strong className="tabular-nums">{totalWeight}%</strong> (bukan 100%). Sistem otomatis menormalisasi bobot secara proporsional saat menghitung Nilai Akhir.
            </span>
          </div>
        )}

        {/* Matriks Tabel Buku Nilai */}
        {students.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Calculator className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">Daftar Mahasiswa Masih Kosong</h4>
            <p className="text-xs text-slate-500">
              Silakan tambahkan mahasiswa pada Tab 1 (Manajemen Kelas &amp; Daftar Mahasiswa) terlebih dahulu.
            </p>
          </div>
        ) : indicators.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Calculator className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">
              Belum Ada Indikator Penilaian Rubrik
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Pilih mata kuliah yang memiliki rubrik dari Modul 3 atau tambahkan indikator penilaian secara mandiri.
            </p>
            <button
              type="button"
              onClick={onOpenAddIndicator}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-blue-900 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Tambah Indikator Manual</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3 px-3 font-semibold border-r border-slate-700 w-10 text-center sticky left-0 z-20 bg-slate-900">
                    No
                  </th>
                  <th className="py-3 px-3 font-semibold border-r border-slate-700 min-w-[115px] sticky left-10 z-20 bg-slate-900">
                    NIM
                  </th>
                  <th className="py-3 px-3 font-semibold border-r border-slate-700 min-w-[180px] sticky left-[155px] z-20 bg-slate-900">
                    Nama Mahasiswa
                  </th>

                  {indicators.map((ind) => (
                    <th
                      key={ind.id}
                      className="py-2.5 px-3 font-normal border-r border-slate-700 min-w-[165px] align-top bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[11px] font-semibold text-amber-300 leading-tight">
                          {ind.bentuk_instrumen}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-[11px] font-bold bg-blue-900 text-white px-1.5 py-0.5 rounded tabular-nums">
                            {ind.bobot}%
                          </span>
                          {ind.is_manual && (
                            <button
                              type="button"
                              onClick={() => onDeleteIndicator(ind.id)}
                              title="Hapus indikator manual"
                              className="text-slate-400 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-white mt-1 line-clamp-2 leading-snug" title={ind.nama_indikator}>
                        {ind.nama_indikator}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1">
                        {ind.cpmk} · {ind.sub_cpmk}
                      </div>
                    </th>
                  ))}

                  {showCpmkColumns &&
                    uniqueCpmks.map((cpmkCode) => (
                      <th
                        key={cpmkCode}
                        className="py-3 px-3 font-semibold border-r border-slate-700 bg-blue-950 text-center min-w-[92px] whitespace-nowrap"
                      >
                        <div className="text-[11px] text-amber-300">Capaian</div>
                        <div className="text-xs font-bold">{cpmkCode}</div>
                      </th>
                    ))}

                  <th className="py-3 px-3 font-semibold border-r border-slate-700 bg-slate-950 text-center min-w-[96px] whitespace-nowrap">
                    <div className="text-[11px] text-slate-300">Skor 0–100</div>
                    <div className="text-xs font-bold text-amber-400">Nilai Akhir</div>
                  </th>
                  <th className="py-3 px-3 font-semibold bg-slate-950 text-center min-w-[84px] whitespace-nowrap">
                    <div className="text-[11px] text-slate-300">Konversi</div>
                    <div className="text-xs font-bold text-white">Mutu</div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {students.map((student, rowIndex) => {
                  const calc = gradeLookup.get(student.id);
                  const studentScores = scores[student.id] || {};

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-2 px-3 text-center text-xs text-slate-500 border-r border-slate-200 tabular-nums sticky left-0 z-10 bg-white">
                        {rowIndex + 1}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-slate-700 border-r border-slate-200 tabular-nums sticky left-10 z-10 bg-white whitespace-nowrap">
                        {student.nim}
                      </td>
                      <td className="py-2 px-3 font-medium text-xs sm:text-sm text-slate-900 border-r border-slate-200 sticky left-[155px] z-10 bg-white whitespace-nowrap">
                        {student.nama}
                      </td>

                      {indicators.map((ind) => {
                        const rawVal = studentScores[ind.id];
                        const rubricLevel = scoreToRubricLevel(rawVal);

                        return (
                          <td
                            key={ind.id}
                            className="py-2 px-2.5 border-r border-slate-200 align-middle"
                          >
                            {scaleMode === 'raw_100' ? (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.5"
                                value={rawVal ?? ''}
                                onChange={(e) => {
                                  const str = e.target.value;
                                  if (str === '') {
                                    onScoreChange(student.id, ind.id, null);
                                  } else {
                                    const num = Math.max(0, Math.min(100, Number(str)));
                                    onScoreChange(
                                      student.id,
                                      ind.id,
                                      Number.isNaN(num) ? null : num
                                    );
                                  }
                                }}
                                placeholder="0–100"
                                className="w-full text-right font-mono text-xs sm:text-sm rounded-md border border-slate-300 px-2 py-1.5 text-slate-900 tabular-nums focus:border-blue-800 focus:ring-1 focus:ring-blue-800 focus:outline-none"
                              />
                            ) : (
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                  {([1, 2, 3, 4] as const).map((lvl) => (
                                    <button
                                      key={lvl}
                                      type="button"
                                      onClick={() =>
                                        onScoreChange(
                                          student.id,
                                          ind.id,
                                          rubricLevelToScore(lvl)
                                        )
                                      }
                                      title={`Skala ${lvl} (${rubricLevelToScore(lvl)})`}
                                      className={`w-6 h-6 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer ${
                                        rubricLevel === lvl
                                          ? 'bg-slate-900 text-amber-300'
                                          : 'text-slate-600 hover:bg-white'
                                      }`}
                                    >
                                      {lvl}
                                    </button>
                                  ))}
                                </div>
                                <span className="font-mono text-xs text-slate-600 tabular-nums w-8 text-right">
                                  {typeof rawVal === 'number' ? rawVal : '-'}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {showCpmkColumns &&
                        uniqueCpmks.map((cpmkCode) => {
                          const cpmkData = calc?.skorPerCpmk[cpmkCode];
                          return (
                            <td
                              key={cpmkCode}
                              className="py-2 px-3 text-center font-mono text-xs text-blue-900 bg-blue-50/40 border-r border-slate-200 tabular-nums"
                            >
                              {cpmkData ? `${cpmkData.percentage.toFixed(1)}%` : '0.0%'}
                            </td>
                          );
                        })}

                      <td className="py-2 px-3 text-center font-mono text-sm font-bold text-slate-900 bg-slate-50 border-r border-slate-200 tabular-nums">
                        {calc ? calc.nilaiAkhir.toFixed(1) : '0.0'}
                      </td>
                      <td className="py-2 px-3 text-center bg-slate-50">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded border text-xs font-bold ${
                            calc
                              ? getLetterBadgeStyle(calc.hurufMutu)
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {calc ? calc.hurufMutu : 'E'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legenda Konversi Huruf Mutu */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-800">Pedoman Konversi Mutu:</span>
          {GRADE_SCALE_LEGEND.map((item) => (
            <span key={item.grade} className="tabular-nums">
              <strong className="text-slate-900">{item.grade}</strong> ({item.label})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
