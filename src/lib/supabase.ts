import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  DaftarNilaiRubrikPayload,
  DokumenPortofolioPayload,
  PortfolioCategory,
  PortfolioFile,
  RpsCourse,
  RubrikIndicator,
} from '../types/obe';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || '[MASUKKAN_PROJECT_URL_SUPABASE_ANDA]';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || '[MASUKKAN_ANON_KEY_SUPABASE_ANDA]';

export const MODUL_5_URL =
  import.meta.env.VITE_MODUL_5_URL || '[MASUKKAN_URL_MODUL_5_PENGUKURAN_CPL]';

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http://') || SUPABASE_URL.startsWith('https://');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function fetchRpsList(): Promise<{
  data: RpsCourse[];
  fromSupabase: boolean;
  error?: string;
}> {
  if (!supabase) {
    return { data: [], fromSupabase: false };
  }

  const { data, error } = await supabase
    .from('obe_rps')
    .select('id, kode_mk, nama_mk, prodi, tahun_akademik, dosen_pengampu, status_siklus')
    .order('kode_mk', { ascending: true });

  if (error) {
    return { data: [], fromSupabase: true, error: error.message };
  }

  return {
    data: (data || []) as RpsCourse[],
    fromSupabase: true,
  };
}

interface RawRubrikRow {
  id: string;
  rps_id: string;
  kode_indikator?: string;
  nama_indikator?: string;
  indikator_penilaian?: string;
  indikator?: string;
  bentuk_instrumen?: string;
  instrumen?: string;
  jenis_asesmen?: string;
  cpmk?: string;
  kode_cpmk?: string;
  sub_cpmk?: string;
  kode_sub_cpmk?: string;
  bobot?: number | string;
  bobot_nilai?: number | string;
  kriteria_deskripsi?: string;
  kriteria?: string;
}

export async function fetchRpsAndRubrik(rpsId: string): Promise<{
  rps: RpsCourse | null;
  rubrik: RubrikIndicator[];
  error?: string;
}> {
  if (!supabase) {
    return { rps: null, rubrik: [] };
  }

  const [rpsRes, rubrikRes] = await Promise.all([
    supabase
      .from('obe_rps')
      .select('id, kode_mk, nama_mk, prodi, tahun_akademik, dosen_pengampu, status_siklus')
      .eq('id', rpsId)
      .maybeSingle(),
    supabase
      .from('obe_rubrik')
      .select('*')
      .eq('rps_id', rpsId),
  ]);

  if (rpsRes.error) {
    return { rps: null, rubrik: [], error: rpsRes.error.message };
  }

  if (rubrikRes.error) {
    return {
      rps: (rpsRes.data as RpsCourse) || null,
      rubrik: [],
      error: rubrikRes.error.message,
    };
  }

  const mappedRubrik: RubrikIndicator[] = ((rubrikRes.data || []) as RawRubrikRow[]).map(
    (row, idx) => ({
      id: String(row.id || `ind_${idx + 1}`),
      rps_id: String(row.rps_id || rpsId),
      kode_indikator: String(row.kode_indikator || `indikator_${idx + 1}`),
      nama_indikator: String(
        row.nama_indikator || row.indikator_penilaian || row.indikator || `Indikator ${idx + 1}`
      ),
      bentuk_instrumen: String(
        row.bentuk_instrumen || row.instrumen || row.jenis_asesmen || 'Asesmen Rubrik'
      ),
      cpmk: String(row.cpmk || row.kode_cpmk || 'CPMK-1'),
      sub_cpmk: String(row.sub_cpmk || row.kode_sub_cpmk || `Sub-CPMK ${idx + 1}`),
      bobot: Number(row.bobot ?? row.bobot_nilai ?? 0) || 0,
      kriteria_deskripsi: row.kriteria_deskripsi || row.kriteria || undefined,
      is_manual: false,
    })
  );

  return {
    rps: (rpsRes.data as RpsCourse) || null,
    rubrik: mappedRubrik,
  };
}

export async function uploadPortfolioFileToStorage(params: {
  file: File;
  rpsId: string;
  kelas: string;
  category: PortfolioCategory;
}): Promise<PortfolioFile> {
  const { file, rpsId, kelas, category } = params;
  const safeKelas = kelas.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Kelas_A';
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${rpsId}/${safeKelas}/${category}/${Date.now()}_${safeFileName}`;

  if (!supabase) {
    const objectUrl = URL.createObjectURL(file);
    return {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      category,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      url: objectUrl,
      storagePath,
      uploadedAt: new Date().toISOString(),
      isLocalDemo: true,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from('obe-portofolio')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah ${file.name}: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('obe-portofolio')
    .getPublicUrl(storagePath);

  return {
    id: `sb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    url: urlData.publicUrl,
    storagePath,
    uploadedAt: new Date().toISOString(),
    isLocalDemo: false,
  };
}

export async function savePortfolioAndSync(payload: {
  rps_id: string;
  kelas: string;
  tahun_akademik: string;
  daftar_nilai_rubrik: DaftarNilaiRubrikPayload[];
  dokumen_portofolio: DokumenPortofolioPayload;
}): Promise<{ id: string; isSimulated: boolean; redirectUrl: string }> {
  if (!supabase) {
    const simulatedId = `demo-portofolio-${Date.now()}`;
    const redirectUrl = `${MODUL_5_URL}?rps_id=${encodeURIComponent(payload.rps_id)}&portofolio_id=${encodeURIComponent(simulatedId)}`;
    return {
      id: simulatedId,
      isSimulated: true,
      redirectUrl,
    };
  }

  const { data, error } = await supabase
    .from('obe_portofolio_nilai')
    .upsert(
      {
        rps_id: payload.rps_id,
        kelas: payload.kelas,
        tahun_akademik: payload.tahun_akademik,
        daftar_nilai_rubrik: payload.daftar_nilai_rubrik,
        dokumen_portofolio: payload.dokumen_portofolio,
      },
      {
        onConflict: 'rps_id,kelas,tahun_akademik',
      }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan ke tabel obe_portofolio_nilai: ${error.message}`);
  }

  const { error: updateRpsError } = await supabase
    .from('obe_rps')
    .update({ status_siklus: '4_nilai_selesai' })
    .eq('id', payload.rps_id);

  if (updateRpsError) {
    throw new Error(
      `Portofolio tersimpan, namun gagal memperbarui status_siklus di obe_rps: ${updateRpsError.message}`
    );
  }

  const savedId = String(data.id);
  const redirectUrl = `${MODUL_5_URL}?rps_id=${encodeURIComponent(payload.rps_id)}&portofolio_id=${encodeURIComponent(savedId)}`;

  return {
    id: savedId,
    isSimulated: false,
    redirectUrl,
  };
}
