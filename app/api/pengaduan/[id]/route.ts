import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { ComplaintTicket, ComplaintStatus } from '@/domain/models';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'puri_complaints.json');

function getComplaintsFromFile(): ComplaintTicket[] {
  try {
    if (!fs.existsSync(COMPLAINTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(COMPLAINTS_FILE, 'utf8')) as ComplaintTicket[];
  } catch {
    return [];
  }
}

function writeComplaintsToFile(data: ComplaintTicket[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaints = getComplaintsFromFile();
    const item = complaints.find((c) => c.id === id || c.nomorTiket === id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Tiket pengaduan tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const complaints = getComplaintsFromFile();
    const index = complaints.findIndex((c) => c.id === id || c.nomorTiket === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Tiket pengaduan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const item = complaints[index];
    if (body.status) {
      item.status = body.status.toUpperCase() as ComplaintStatus;
    }
    if (body.catatanPetugas !== undefined) {
      item.catatanPetugas = body.catatanPetugas;
    }
    if (body.assignedOperator !== undefined) {
      item.assignedOperator = body.assignedOperator;
    }
    if (body.tindakLanjut) {
      item.tindakLanjut = {
        jawabanPetugas: body.tindakLanjut.jawabanPetugas || body.catatanPetugas || 'Laporan telah ditindaklanjuti dan diselesaikan.',
        namaPetugas: body.tindakLanjut.namaPetugas || body.assignedOperator || 'Staf Dinas PUPR',
        nomorKontakPetugas: body.tindakLanjut.nomorKontakPetugas || '',
        waktuSelesai: body.tindakLanjut.waktuSelesai || new Date().toISOString(),
        buktiLampiran: body.tindakLanjut.buktiLampiran || body.buktiLampiran || [],
        channel: body.tindakLanjut.channel || 'COMMAND_CENTER'
      };
      if (body.tindakLanjut.buktiLampiran && Array.isArray(body.tindakLanjut.buktiLampiran)) {
        item.buktiLampiran = [...(item.buktiLampiran || []), ...body.tindakLanjut.buktiLampiran];
      }
    } else if (body.buktiLampiran && Array.isArray(body.buktiLampiran)) {
      item.buktiLampiran = [...(item.buktiLampiran || []), ...body.buktiLampiran];
    }
    item.updatedAt = new Date().toISOString();

    complaints[index] = item;
    writeComplaintsToFile(complaints);

    // Kirim notifikasi otomatis ke WhatsApp pelapor jika diminta
    if (body.notifyCitizen && item.nomorKontak) {
      try {
        const baileysUrl = (process.env.BAILEYS_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        const apiKey = String(process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026').replace(/^["']|["']$/g, '').trim();
        
        const statusMap: Record<string, string> = {
          SELESAI: '✅ SELESAI',
          DIPROSES: '🔄 SEDANG DIPROSES',
          DITOLAK: '❌ DITOLAK',
          PENDING: '⏳ MENUNGGU VERIFIKASI',
        };
        const statusLabel = statusMap[item.status] || item.status;

        const notifText = `🏛️ *PURI (Pelayanan Umum & Informasi PUPR Garut)*\n────────────────────────\nKpd. Yth. *${item.pelapor}*\n\nBerikut perkembangan status laporan pengaduan Anda:\n📋 *Nomor Tiket:* ${item.nomorTiket}\n📍 *Lokasi:* ${item.lokasi}\n⚡ *Status:* *${statusLabel}*\n${item.catatanPetugas ? `📝 *Catatan Petugas:* ${item.catatanPetugas}\n` : ''}\nTerima kasih atas kepedulian Anda dalam menjaga fasilitas dan infrastruktur Kabupaten Garut. Laporan Anda ditangani oleh *${item.assignedOperator || 'Tim Teknis Dinas PUPR Garut'}*. 🙏`;

        // Format nomor telepon
        let targetPhone = item.nomorKontak.replace(/\D/g, '');
        if (targetPhone.startsWith('0')) targetPhone = '62' + targetPhone.substring(1);
        else if (targetPhone.startsWith('8')) targetPhone = '62' + targetPhone;

        await fetch(`${baileysUrl}/api/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-baileys-api-key': apiKey,
          },
          body: JSON.stringify({
            to: targetPhone,
            text: notifText,
            sender: 'operator',
          }),
        }).catch((err) => {
          console.warn('[API Pengaduan] Gagal mengirim pesan notifikasi WA:', err.message);
        });
      } catch (notifErr: any) {
        console.warn('[API Pengaduan] Exception saat memicu notifikasi WA:', notifErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status tiket pengaduan berhasil diperbarui.',
      data: item,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
