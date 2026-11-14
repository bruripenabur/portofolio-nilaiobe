import type {
  CalculatedStudentGrade,
  GradeStats,
  LetterGrade,
  RubrikIndicator,
  ScoreMap,
  Student,
} from '../types/obe';

export const LETTER_GRADES_ORDER: LetterGrade[] = [
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'D',
  'E',
];

export const GRADE_SCALE_LEGEND: Array<{
  grade: LetterGrade;
  min: number;
  label: string;
}> = [
  { grade: 'A', min: 85, label: '85 – 100 (Sangat Baik)' },
  { grade: 'A-', min: 80, label: '80 – 84,9' },
  { grade: 'B+', min: 75, label: '75 – 79,9' },
  { grade: 'B', min: 70, label: '70 – 74,9 (Baik)' },
  { grade: 'B-', min: 65, label: '65 – 69,9' },
  { grade: 'C+', min: 60, label: '60 – 64,9' },
  { grade: 'C', min: 55, label: '55 – 59,9 (Cukup)' },
  { grade: 'D', min: 40, label: '40 – 54,9 (Kurang)' },
  { grade: 'E', min: 0, label: '< 40 (Tidak Lulus)' },
];

export function scoreToLetterGrade(score: number): LetterGrade {
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

export function rubricLevelToScore(level: 1 | 2 | 3 | 4): number {
  switch (level) {
    case 4:
      return 100;
    case 3:
      return 75;
    case 2:
      return 50;
    case 1:
      return 25;
  }
}

export function scoreToRubricLevel(score: number | null | undefined): 1 | 2 | 3 | 4 | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 87.5) return 4;
  if (score >= 62.5) return 3;
  if (score >= 37.5) return 2;
  return 1;
}

export function calculateStudentGrades(
  students: Student[],
  indicators: RubrikIndicator[],
  scores: ScoreMap
): CalculatedStudentGrade[] {
  const totalWeight = indicators.reduce((sum, ind) => sum + (Number(ind.bobot) || 0), 0);

  return students.map((student) => {
    const studentScores = scores[student.id] || {};
    const skorIndikator: Record<string, number> = {};
    const skorPerCpmk: Record<string, { earned: number; maxWeight: number; percentage: number }> = {};

    let weightedSum = 0;
    let filledCount = 0;

    indicators.forEach((ind) => {
      const key = ind.kode_indikator || ind.id;
      const rawVal = studentScores[ind.id];
      const numericScore =
        typeof rawVal === 'number' && !Number.isNaN(rawVal)
          ? Math.max(0, Math.min(100, rawVal))
          : 0;

      if (typeof rawVal === 'number' && !Number.isNaN(rawVal)) {
        filledCount += 1;
      }

      skorIndikator[key] = Number(numericScore.toFixed(2));
      const weight = Number(ind.bobot) || 0;
      weightedSum += (numericScore * weight) / 100;

      const cpmkKey = ind.cpmk || 'CPMK-1';
      if (!skorPerCpmk[cpmkKey]) {
        skorPerCpmk[cpmkKey] = { earned: 0, maxWeight: 0, percentage: 0 };
      }
      skorPerCpmk[cpmkKey].earned += (numericScore * weight) / 100;
      skorPerCpmk[cpmkKey].maxWeight += weight;
    });

    Object.keys(skorPerCpmk).forEach((cpmkKey) => {
      const entry = skorPerCpmk[cpmkKey];
      entry.percentage =
        entry.maxWeight > 0 ? Number(((entry.earned / entry.maxWeight) * 100).toFixed(1)) : 0;
    });

    const normalizedFinal =
      totalWeight > 0 ? Number(((weightedSum / totalWeight) * 100).toFixed(1)) : 0;

    return {
      studentId: student.id,
      nim: student.nim,
      nama: student.nama,
      skorIndikator,
      skorPerCpmk,
      nilaiAkhir: normalizedFinal,
      hurufMutu: scoreToLetterGrade(normalizedFinal),
      isComplete: indicators.length > 0 && filledCount === indicators.length,
    };
  });
}

export function calculateClassStats(grades: CalculatedStudentGrade[]): GradeStats {
  const distribution: Record<LetterGrade, number> = {
    A: 0,
    'A-': 0,
    'B+': 0,
    B: 0,
    'B-': 0,
    'C+': 0,
    C: 0,
    D: 0,
    E: 0,
  };

  if (grades.length === 0) {
    return {
      totalStudents: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      passRate: 0,
      distribution,
    };
  }

  let sum = 0;
  let highest = -Infinity;
  let lowest = Infinity;
  let passCount = 0;

  grades.forEach((g) => {
    sum += g.nilaiAkhir;
    if (g.nilaiAkhir > highest) highest = g.nilaiAkhir;
    if (g.nilaiAkhir < lowest) lowest = g.nilaiAkhir;
    if (g.nilaiAkhir >= 55) passCount += 1;
    distribution[g.hurufMutu] += 1;
  });

  return {
    totalStudents: grades.length,
    average: Number((sum / grades.length).toFixed(2)),
    highest: Number(highest.toFixed(1)),
    lowest: Number(lowest.toFixed(1)),
    passRate: Number(((passCount / grades.length) * 100).toFixed(1)),
    distribution,
  };
}

export function parsePastedStudents(rawText: string): Array<{ nim: string; nama: string }> {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: Array<{ nim: string; nama: string }> = [];

  lines.forEach((line, index) => {
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      const match = line.match(/^(\S+)\s+(.+)$/);
      if (match) {
        parts = [match[1], match[2]];
      }
    }

    if (parts.length >= 2) {
      const nim = parts[0].replace(/^"|"$/g, '').trim();
      const nama = parts.slice(1).join(' ').replace(/^"|"$/g, '').trim();

      if (
        index === 0 &&
        nim.toLowerCase() === 'nim' &&
        (nama.toLowerCase().includes('nama') || nama.toLowerCase().includes('name'))
      ) {
        return;
      }

      if (nim && nama) {
        parsed.push({ nim, nama });
      }
    }
  });

  return parsed;
}

export function buildStudentCsvTemplate(): string {
  return [
    'NIM,Nama Lengkap',
    '202351001,Adrian Pattinaya',
    '202351002,Beatrice Latuheru',
    '202351003,Chandra Tehupuring',
  ].join('\n');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
