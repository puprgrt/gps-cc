import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { ComplaintTicket, ComplaintStats } from '@/domain/models';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'puri_complaints.json');

function getComplaintsFromFile(): ComplaintTicket[] {
  try {
    if (!fs.existsSync(COMPLAINTS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(COMPLAINTS_FILE, 'utf8');
    return JSON.parse(content) as ComplaintTicket[];
  } catch (error) {
    console.error('[API Pengaduan] Gagal membaca data dari file lokal:', error);
    return [];
  }
}

function writeComplaintsToFile(data: ComplaintTicket[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[API Pengaduan] Gagal menulis data ke file lokal:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const bidang = searchParams.get('bidang');
    const prioritas = searchParams.get('prioritas');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    let complaints = getComplaintsFromFile();

    // Hitung statistik lengkap
    const stats: ComplaintStats = {
      total: complaints.length,
      kritis: complaints.filter((c) => c.prioritas === 'KRITIS').length,
      tinggi: complaints.filter((c) => c.prioritas === 'TINGGI').length,
      normal: complaints.filter((c) => c.prioritas === 'NORMAL' || c.prioritas === 'RENDAH').length,
      pending: complaints.filter((c) => c.status === 'PENDING').length,
      diproses: complaints.filter((c) => c.status === 'DIPROSES').length,
      selesai: complaints.filter((c) => c.status === 'SELESAI').length,
      byBidang: {},
    };

    complaints.forEach((c) => {
      const b = c.bidang || 'UMUM';
      stats.byBidang[b] = (stats.byBidang[b] || 0) + 1;
    });

    // Terapkan filter
    if (status && status !== 'SEMUA') {
      complaints = complaints.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
    if (bidang && bidang !== 'SEMUA') {
      complaints = complaints.filter((c) => c.bidang.toUpperCase() === bidang.toUpperCase());
    }
    if (prioritas && prioritas !== 'SEMUA') {
      complaints = complaints.filter((c) => c.prioritas.toUpperCase() === prioritas.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      complaints = complaints.filter(
        (c) =>
          c.nomorTiket.toLowerCase().includes(q) ||
          c.pelapor.toLowerCase().includes(q) ||
          c.lokasi.toLowerCase().includes(q) ||
          c.judul.toLowerCase().includes(q) ||
          (c.nomorKontak && c.nomorKontak.includes(q))
      );
    }

    // Urutkan dari yang terbaru
    complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (limit && limit > 0) {
      complaints = complaints.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      total: complaints.length,
      stats,
      data: complaints,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.pelapor || !body.judul || !body.lokasi) {
      return NextResponse.json(
        { success: false, error: 'Data pelapor, judul, dan lokasi wajib diisi.' },
        { status: 400 }
      );
    }

    const complaints = getComplaintsFromFile();
    const now = new Date();
    const seq = complaints.length + 1;
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const nomorTiket = `TKT-${yyyy}${mm}${dd}-${String(seq).padStart(3, '0')}`;

    const newTicket: ComplaintTicket = {
      id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nomorTiket,
      pelapor: body.pelapor,
      nomorKontak: body.nomorKontak || '',
      lokasi: body.lokasi,
      kecamatan: body.kecamatan || 'Garut Kota',
      judul: body.judul,
      deskripsi: body.deskripsi || body.judul,
      bidang: body.bidang || 'SEKRETARIAT',
      bidangLabel: body.bidangLabel || body.bidang || 'Sekretariat',
      kategori: body.kategori || 'Pengaduan Layanan',
      prioritas: body.prioritas || 'NORMAL',
      status: 'PENDING',
      langkahPenanganan: body.langkahPenanganan || 'Menunggu verifikasi operator bidang.',
      ringkasanBot: body.ringkasanBot || undefined,
      assignedOperator: body.assignedOperator || 'Operator Command Center',
      catatanPetugas: body.catatanPetugas || 'Tiket dibuat secara manual oleh operator.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      source: body.source || 'MANUAL',
    };

    complaints.unshift(newTicket);
    writeComplaintsToFile(complaints);

    return NextResponse.json({
      success: true,
      message: 'Tiket pengaduan berhasil didaftarkan.',
      data: newTicket,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
