import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  CalculatedStudentGrade,
  GradeStats,
  PortfolioFile,
  RpsCourse,
  RubrikIndicator,
} from '../types/obe';
import { LETTER_GRADES_ORDER } from './grading';

interface ExportPortfolioPdfParams {
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

interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export function exportPortfolioToPdf({
  course,
  kelas,
  tahunAkademik,
  indicators,
  calculatedGrades,
  stats,
  files,
  reflectionText,
}: ExportPortfolioPdfParams): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as JsPdfWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;

  const navy: [number, number, number] = [15, 23, 42];
  const blue: [number, number, number] = [30, 58, 138];
  const gold: [number, number, number] = [234, 179, 8];
  const slateText: [number, number, number] = [51, 65, 85];

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const ensureSpace = (neededHeight: number, currentY: number): number => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      return 18;
    }
    return currentY;
  };

  // --- KOP RESMI UNIVERSITAS PATTIMURA ---
  doc.setFillColor(...navy);
  doc.rect(marginX, 12, contentWidth, 2.2, 'F');
  doc.setFillColor(...gold);
  doc.rect(marginX, 14.5, contentWidth, 0.8, 'F');

  doc.setTextColor(...slateText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', pageWidth / 2, 20, {
    align: 'center',
  });

  doc.setTextColor(...navy);
  doc.setFontSize(13.5);
  doc.text('UNIVERSITAS PATTIMURA', pageWidth / 2, 25.5, { align: 'center' });

  doc.setTextColor(...blue);
  doc.setFontSize(9.5);
  doc.text(
    'PUSAT KURIKULUM DAN INOVASI PEMBELAJARAN (PKIP) · EKOSISTEM DIGITAL SIMPEL-OBE',
    pageWidth / 2,
    30.5,
    { align: 'center' }
  );

  doc.setTextColor(...slateText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'Jl. Ir. M. Putuhena, Kampus Poka, Ambon 97233 · Dokumen Mutu Akademik (Direct Evidence Akreditasi)',
    pageWidth / 2,
    34.5,
    { align: 'center' }
  );

  doc.setDrawColor(...navy);
  doc.setLineWidth(0.6);
  doc.line(marginX, 37, pageWidth - marginX, 37);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(marginX, 38, pageWidth - marginX, 38);

  // Title Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.35);
  doc.rect(marginX, 41, contentWidth, 11, 'FD');
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    'LAPORAN PORTOFOLIO PERKULIAHAN & BUKU NILAI BERBASIS RUBRIK',
    pageWidth / 2,
    47.8,
    { align: 'center' }
  );

  let y = 57;

  // --- 01. IDENTITAS MATA KULIAH ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('01. IDENTITAS MATA KULIAH & PELAKSANAAN KELAS', marginX, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: navy,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 38 },
      1: { cellWidth: 52 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 38 },
      3: { cellWidth: 52 },
    },
    body: [
      [
        'Kode Mata Kuliah',
        course?.kode_mk || '-',
        'Program Studi',
        course?.prodi || '-',
      ],
      [
        'Nama Mata Kuliah',
        course?.nama_mk || '-',
        'Kelas / Periode',
        `${kelas} (${tahunAkademik})`,
      ],
      [
        'Dosen Pengampu',
        course?.dosen_pengampu || '-',
        'Tanggal Cetak',
        todayFormatted,
      ],
    ],
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 7;

  // --- 02. MATRIKS INDIKATOR RUBRIK ---
  y = ensureSpace(28, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('02. MATRIKS INDIKATOR RUBRIK & BOBOT PENILAIAN (MODUL 3)', marginX, y);
  y += 2.5;

  const totalWeight = indicators.reduce((s, i) => s + (Number(i.bobot) || 0), 0);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: navy,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 32 },
      2: { cellWidth: 28 },
      3: { cellWidth: 'auto' },
      4: { halign: 'right', cellWidth: 16 },
    },
    head: [['Kode', 'CPMK / Sub-CPMK', 'Instrumen', 'Indikator Penilaian', 'Bobot']],
    body: [
      ...indicators.map((ind) => [
        ind.kode_indikator,
        `${ind.cpmk} (${ind.sub_cpmk})`,
        ind.bentuk_instrumen,
        ind.nama_indikator,
        `${ind.bobot}%`,
      ]),
      [
        {
          content: 'Total Bobot Keseluruhan',
          colSpan: 4,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
        },
        {
          content: `${totalWeight}%`,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
        },
      ],
    ],
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 7;

  // --- 03. RINGKASAN STATISTIK & DISTRIBUSI HURUF MUTU ---
  y = ensureSpace(36, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('03. RINGKASAN STATISTIK & DISTRIBUSI HURUF MUTU KELAS', marginX, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      halign: 'center',
      textColor: navy,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    head: [['Peserta Dinilai', 'Rata-rata Kelas', 'Nilai Tertinggi', 'Nilai Terendah', 'Kelulusan (≥ C)']],
    body: [
      [
        `${stats.totalStudents} Mahasiswa`,
        stats.average.toFixed(2),
        stats.highest.toFixed(1),
        stats.lowest.toFixed(1),
        `${stats.passRate.toFixed(1)}%`,
      ],
    ],
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 3;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: navy,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      halign: 'center',
      textColor: navy,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    head: [LETTER_GRADES_ORDER],
    body: [
      LETTER_GRADES_ORDER.map((letter) => `${stats.distribution[letter] || 0} mhs`),
    ],
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 7;

  // --- 04. REKAPITULASI BUKU NILAI MAHASISWA ---
  y = ensureSpace(32, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('04. REKAPITULASI NILAI AKHIR & HURUF MUTU MAHASISWA', marginX, y);
  y += 2.5;

  const gradeHead = [
    'No',
    'NIM',
    'Nama Mahasiswa',
    ...indicators.map((_, idx) => `Ind.${idx + 1}`),
    'Nilai Akhir',
    'Mutu',
  ];

  const gradeBody =
    calculatedGrades.length === 0
      ? [
          [
            {
              content: 'Belum ada data mahasiswa yang dinilai.',
              colSpan: gradeHead.length,
              styles: { halign: 'center' as const },
            },
          ],
        ]
      : calculatedGrades.map((g, index) => [
          String(index + 1),
          g.nim,
          g.nama,
          ...indicators.map((ind) => {
            const key = ind.kode_indikator || ind.id;
            return String(g.skorIndikator[key] ?? 0);
          }),
          g.nilaiAkhir.toFixed(1),
          g.hurufMutu,
        ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: navy,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { cellWidth: 23 },
      2: { cellWidth: 'auto' },
      [gradeHead.length - 2]: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
      [gradeHead.length - 1]: { halign: 'center', fontStyle: 'bold', cellWidth: 13 },
    },
    head: [gradeHead],
    body: gradeBody,
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 7;

  // --- 05. REFLEKSI DOSEN & CQI ---
  y = ensureSpace(32, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('05. REFLEKSI PELAKSANAAN PERKULIAHAN & RENCANA TINDAK LANJUT (CQI)', marginX, y);
  y += 3;

  const reflectionBodyText =
    reflectionText.trim() ||
    'Belum ada narasi refleksi dosen yang disusun pada Tab 3.';

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: navy,
      fillColor: [248, 250, 252],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    body: [[reflectionBodyText]],
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 7;

  // --- 06. DAFTAR LAMPIRAN BUKTI PORTOFOLIO ---
  y = ensureSpace(28, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('06. DAFTAR LAMPIRAN BUKTI PORTOFOLIO (DIRECT EVIDENCE)', marginX, y);
  y += 2.5;

  const evidenceBody =
    files.length === 0
      ? [
          [
            {
              content: 'Belum ada berkas bukti portofolio yang diunggah.',
              colSpan: 4,
              styles: { halign: 'center' as const },
            },
          ],
        ]
      : files.map((file, idx) => [
          String(idx + 1),
          CATEGORY_LABELS[file.category],
          file.name,
          file.storagePath || file.url,
        ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 2,
      textColor: navy,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 52 },
      2: { cellWidth: 48 },
      3: { cellWidth: 'auto' },
    },
    head: [['No', 'Kategori Audit Mutu', 'Nama Berkas', 'Jalur / Tautan Penyimpanan']],
    body: evidenceBody,
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // --- BLOK PENGESAHAN ---
  y = ensureSpace(38, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...navy);

  const leftSigX = marginX + 4;
  const rightSigX = pageWidth / 2 + 12;

  doc.text('Mengetahui,', leftSigX, y);
  doc.text(`Ambon, ${todayFormatted}`, rightSigX, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Ketua Program Studi / Gugus Penjaminan Mutu', leftSigX, y);
  doc.text('Dosen Pengampu Mata Kuliah', rightSigX, y);

  y += 20;
  doc.text('( ....................................................... )', leftSigX, y);
  doc.text(
    course?.dosen_pengampu || '( ....................................................... )',
    rightSigX,
    y
  );

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP. ........................................', leftSigX, y);
  doc.text('NIDN / NIP.', rightSigX, y);

  // --- FOOTER NOMOR HALAMAN ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `SIMPEL-OBE 04 · Pusat Kurikulum dan Inovasi Pembelajaran — Universitas Pattimura`,
      marginX,
      pageHeight - 8.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8.5, {
      align: 'right',
    });
  }

  const kodeMkSafe = (course?.kode_mk || 'MK').replace(/[^a-zA-Z0-9_-]/g, '_');
  const kelasSafe = (kelas || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Laporan_Portofolio_OBE_${kodeMkSafe}_${kelasSafe}.pdf`;

  doc.save(fileName);
  return fileName;
}
