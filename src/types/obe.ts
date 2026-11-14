export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'E';

export type ScoringScaleMode = 'raw_100' | 'rubric_4';

export type PortfolioCategory = 'tinggi' | 'sedang' | 'rendah' | 'bap';

export interface RpsCourse {
  id: string;
  kode_mk: string;
  nama_mk: string;
  prodi: string;
  tahun_akademik: string;
  dosen_pengampu: string;
  sks?: number;
  semester?: string;
  status_siklus?: string;
  cpmk_list?: Array<{
    kode: string;
    deskripsi: string;
  }>;
}

export interface RubrikIndicator {
  id: string;
  rps_id: string;
  kode_indikator: string;
  nama_indikator: string;
  bentuk_instrumen: string;
  cpmk: string;
  sub_cpmk: string;
  bobot: number;
  kriteria_deskripsi?: string;
  is_manual?: boolean;
}

export interface Student {
  id: string;
  nim: string;
  nama: string;
}

export type ScoreMap = Record<string, Record<string, number | null>>;

export interface CalculatedStudentGrade {
  studentId: string;
  nim: string;
  nama: string;
  skorIndikator: Record<string, number>;
  skorPerCpmk: Record<string, { earned: number; maxWeight: number; percentage: number }>;
  nilaiAkhir: number;
  hurufMutu: LetterGrade;
  isComplete: boolean;
}

export interface GradeStats {
  totalStudents: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  distribution: Record<LetterGrade, number>;
}

export interface PortfolioFile {
  id: string;
  category: PortfolioCategory;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  storagePath?: string;
  uploadedAt: string;
  isLocalDemo?: boolean;
}

export interface DaftarNilaiRubrikPayload {
  nim: string;
  nama: string;
  skor_indikator: Record<string, number>;
  nilai_akhir: number;
  huruf_mutu: LetterGrade;
}

export interface DokumenPortofolioPayload {
  bukti_tinggi: Array<{ name: string; url: string; path?: string; uploaded_at: string }>;
  bukti_sedang: Array<{ name: string; url: string; path?: string; uploaded_at: string }>;
  bukti_rendah: Array<{ name: string; url: string; path?: string; uploaded_at: string }>;
  bap_presensi: Array<{ name: string; url: string; path?: string; uploaded_at: string }>;
  refleksi_dosen: string;
}
