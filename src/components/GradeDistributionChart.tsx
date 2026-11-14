import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { CalculatedStudentGrade, GradeStats, LetterGrade } from '../types/obe';
import { LETTER_GRADES_ORDER } from '../utils/grading';

interface GradeDistributionChartProps {
  calculatedGrades: CalculatedStudentGrade[];
  stats: GradeStats;
}

type ChartGroupingMode = 'grouped_5' | 'detailed_9';

interface ChartDatum {
  label: string;
  count: number;
  percentage: number;
  color: string;
  gradesIncluded: LetterGrade[];
}

const COLOR_BY_GROUP: Record<string, string> = {
  A: '#059669',
  'A-': '#10b981',
  'B+': '#1e3a8a',
  B: '#2563eb',
  'B-': '#3b82f6',
  'C+': '#d97706',
  C: '#f59e0b',
  D: '#ea580c',
  E: '#dc2626',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
}

function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;

  return (
    <div className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 shadow-lg text-xs space-y-0.5">
      <div className="font-display font-bold text-amber-300">
        Huruf Mutu {datum.label}
      </div>
      <div className="tabular-nums">
        Jumlah: <strong className="font-mono">{datum.count}</strong> mahasiswa
      </div>
      <div className="tabular-nums text-slate-300">
        Proporsi: <strong className="font-mono">{datum.percentage.toFixed(1)}%</strong>
      </div>
    </div>
  );
}

export function GradeDistributionChart({
  calculatedGrades,
  stats,
}: GradeDistributionChartProps) {
  const [groupingMode, setGroupingMode] = useState<ChartGroupingMode>('detailed_9');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const chartData: ChartDatum[] = useMemo(() => {
    const total = stats.totalStudents;

    if (groupingMode === 'grouped_5') {
      const groups: Array<{
        label: string;
        grades: LetterGrade[];
        color: string;
      }> = [
        { label: 'A', grades: ['A', 'A-'], color: '#059669' },
        { label: 'B', grades: ['B+', 'B', 'B-'], color: '#1e3a8a' },
        { label: 'C', grades: ['C+', 'C'], color: '#d97706' },
        { label: 'D', grades: ['D'], color: '#ea580c' },
        { label: 'E', grades: ['E'], color: '#dc2626' },
      ];

      return groups.map((g) => {
        const count = g.grades.reduce(
          (sum, letter) => sum + (stats.distribution[letter] || 0),
          0
        );
        return {
          label: g.label,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          color: g.color,
          gradesIncluded: g.grades,
        };
      });
    }

    return LETTER_GRADES_ORDER.map((letter) => {
      const count = stats.distribution[letter] || 0;
      return {
        label: letter,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: COLOR_BY_GROUP[letter] || '#1e3a8a',
        gradesIncluded: [letter],
      };
    });
  }, [groupingMode, stats]);

  const activeDatum = chartData.find((d) => d.label === selectedLabel) || null;
  const studentsInSelectedBucket = useMemo(() => {
    if (!activeDatum) return [];
    const allowed = new Set(activeDatum.gradesIncluded);
    return calculatedGrades.filter((g) => allowed.has(g.hurufMutu));
  }, [activeDatum, calculatedGrades]);

  return (
    <div className="pt-4 border-t border-slate-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-900 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Grafik Distribusi Huruf Mutu Kelas (Real-Time)
            </h4>
            <p className="text-[11px] text-slate-500">
              Klik batang grafik untuk melihat daftar mahasiswa pada kategori mutu tersebut.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setGroupingMode('detailed_9');
              setSelectedLabel(null);
            }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              groupingMode === 'detailed_9'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lengkap (A, A-, B+ ... E)
          </button>
          <button
            type="button"
            onClick={() => {
              setGroupingMode('grouped_5');
              setSelectedLabel(null);
            }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              groupingMode === 'grouped_5'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkas (A–E)
          </button>
        </div>
      </div>

      {stats.totalStudents === 0 ? (
        <div className="h-44 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center text-xs text-slate-500">
          Tambahkan mahasiswa dan isi nilai untuk melihat grafik distribusi huruf mutu.
        </div>
      ) : (
        <div className="h-56 w-full bg-slate-50/50 border border-slate-200 rounded-lg p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: -12, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                interval={0}
                tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomChartTooltip />}
                cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
                onClick={(_barData, index) => {
                  const target = chartData[index];
                  if (target) {
                    setSelectedLabel((prev) =>
                      prev === target.label ? null : target.label
                    );
                  }
                }}
                className="cursor-pointer"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.color}
                    fillOpacity={
                      selectedLabel && selectedLabel !== entry.label ? 0.35 : 0.92
                    }
                    stroke={selectedLabel === entry.label ? '#eab308' : 'none'}
                    strokeWidth={selectedLabel === entry.label ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeDatum && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900">
              Kategori Mutu {activeDatum.label} ({activeDatum.gradesIncluded.join(', ')}) —{' '}
              <span className="tabular-nums">{studentsInSelectedBucket.length} mahasiswa</span>:
            </span>
            <p className="text-slate-600">
              {studentsInSelectedBucket.length === 0
                ? 'Tidak ada mahasiswa pada kategori mutu ini.'
                : studentsInSelectedBucket
                    .map((s) => `${s.nama} (${s.nilaiAkhir.toFixed(1)} · ${s.hurufMutu})`)
                    .join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLabel(null)}
            className="text-blue-900 hover:underline font-semibold cursor-pointer shrink-0"
          >
            Reset pilihan
          </button>
        </div>
      )}
    </div>
  );
}
