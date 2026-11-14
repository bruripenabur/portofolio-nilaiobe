import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

interface ReflectionRequestBody {
  course?: {
    kode_mk?: string;
    nama_mk?: string;
    prodi?: string;
    tahun_akademik?: string;
    dosen_pengampu?: string;
  };
  kelas?: string;
  totalStudents?: number;
  stats?: {
    average?: number;
    highest?: number;
    lowest?: number;
    passRate?: number;
    distribution?: Record<string, number>;
  };
  cpmkPerformance?: Array<{
    cpmk: string;
    averageScore: number;
    indicatorCount: number;
  }>;
  evidenceSummary?: {
    tinggi?: number;
    sedang?: number;
    rendah?: number;
    bap?: number;
  };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada environment server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/generate-reflection', async (req: Request, res: Response) => {
    try {
      const body = req.body as ReflectionRequestBody;
      const course = body.course || {};
      const stats = body.stats || {};
      const distributionText = Object.entries(stats.distribution || {})
        .map(([grade, count]) => `${grade}: ${count} mhs`)
        .join(', ');
      const cpmkText = (body.cpmkPerformance || [])
        .map((c) => `- ${c.cpmk}: rata-rata ${c.averageScore.toFixed(1)} (${c.indicatorCount} indikator)`)
        .join('\n');
      const evidence = body.evidenceSummary || {};

      const prompt = `Anda adalah asisten penjaminan mutu akademik Universitas Pattimura (Pusat Kurikulum dan Inovasi Pembelajaran).
Susunlah draf "Ringkasan Refleksi & Evaluasi Pelaksanaan Perkuliahan Dosen" untuk dokumen Portofolio Perkuliahan OBE (Direct Evidence Akreditasi) dalam Bahasa Indonesia akademik yang baku, objektif, dan konstruktif.

Data Perkuliahan:
- Mata Kuliah: ${course.kode_mk || '-'} - ${course.nama_mk || 'Mata Kuliah'}
- Program Studi: ${course.prodi || '-'}
- Tahun Akademik: ${course.tahun_akademik || '-'}
- Kelas: ${body.kelas || 'Kelas A'}
- Dosen Pengampu: ${course.dosen_pengampu || '-'}
- Jumlah Mahasiswa: ${body.totalStudents || 0} orang

Statistik Capaian Nilai Kelas:
- Rata-rata Kelas: ${typeof stats.average === 'number' ? stats.average.toFixed(2) : '0.00'}
- Nilai Tertinggi: ${typeof stats.highest === 'number' ? stats.highest.toFixed(1) : '0.0'}
- Nilai Terendah: ${typeof stats.lowest === 'number' ? stats.lowest.toFixed(1) : '0.0'}
- Tingkat Kelulusan (Nilai >= C): ${typeof stats.passRate === 'number' ? stats.passRate.toFixed(1) : '0.0'}%
- Sebaran Huruf Mutu: ${distributionText || 'Belum tersedia'}

Capaian Rata-Rata per CPMK:
${cpmkText || '- Data CPMK belum tersedia'}

Kelengkapan Bukti Portofolio:
- Sampel Karya Nilai Tinggi: ${evidence.tinggi || 0} berkas
- Sampel Karya Nilai Sedang: ${evidence.sedang || 0} berkas
- Sampel Karya Nilai Rendah: ${evidence.rendah || 0} berkas
- BAP & Rekap Presensi: ${evidence.bap || 0} berkas

Susun narasi dalam 3 bagian ringkas dan terstruktur (tanpa format markdown berlebihan, cukup judul bagian dan paragraf/poin rapi):
1. Evaluasi Umum Pelaksanaan Perkuliahan & Sebaran Nilai
2. Analisis Ketercapaian CPMK & Kendala Pembelajaran
3. Rencana Tindak Lanjut (Continuous Quality Improvement / CQI) Semester Berikutnya`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Tuliskan narasi refleksi portofolio perkuliahan OBE yang ringkas, faktual berdasarkan data yang diberikan, siap pakai untuk dokumen audit mutu internal/akreditasi perguruan tinggi (sekitar 220-320 kata). Jangan mengarang data numerik di luar yang diberikan.',
        },
      });

      const reflection = response.text?.trim() || '';
      if (!reflection) {
        res.status(502).json({ error: 'Respons AI kosong. Silakan coba kembali.' });
        return;
      }

      res.json({ reflection });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghasilkan refleksi portofolio.';
      console.error('[generate-reflection]', err);
      res.status(500).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMPEL-OBE 04 server berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Gagal memulai server:', error);
  process.exit(1);
});
