import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { 
  BidangForwardingSettings, 
  ForwardDispatchInput, 
  ForwardDispatchResult,
  ForwardHistoryItem
} from '@/domain/whatsappIntegration';

const BAILEYS_URL = (process.env.BAILEYS_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026';

const LOCAL_FILE_PATH = path.join(process.cwd(), 'server/data/bidang_forwarding_settings.json');

function getLocalSettings(): BidangForwardingSettings | null {
  try {
    if (fs.existsSync(LOCAL_FILE_PATH)) {
      const raw = fs.readFileSync(LOCAL_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[API Forward] Gagal membaca data lokal:', e);
  }
  return null;
}

function updateLocalHistoryAndCounter(historyItem: ForwardHistoryItem) {
  try {
    if (fs.existsSync(LOCAL_FILE_PATH)) {
      const settings = JSON.parse(fs.readFileSync(LOCAL_FILE_PATH, 'utf8'));
      if (!Array.isArray(settings.history)) settings.history = [];
      settings.history.unshift(historyItem);
      if (settings.history.length > 100) settings.history = settings.history.slice(0, 100);

      if (settings.contacts && settings.contacts[historyItem.bidang]) {
        settings.contacts[historyItem.bidang].totalForwardedCount = 
          (settings.contacts[historyItem.bidang].totalForwardedCount || 0) + (historyItem.status === 'SUCCESS' ? 1 : 0);
        settings.contacts[historyItem.bidang].lastForwardedAt = new Date().toISOString();
      }

      fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('[API Forward] Gagal mengupdate history lokal:', e);
  }
}

function formatForwardText(input: ForwardDispatchInput, contactName: string, template: string): string {
  const replacements: Record<string, string> = {
    '{{namaBidang}}': contactName || input.bidang,
    '{{nomorTiket}}': input.ticketNumber || `TKT-${Date.now().toString().slice(-6)}`,
    '{{prioritas}}': input.prioritas || 'NORMAL',
    '{{pelapor}}': input.pelaporName || 'Warga Garut',
    '{{kontak}}': input.pelaporPhone || '-',
    '{{lokasi}}': input.lokasi || 'Kabupaten Garut',
    '{{kecamatan}}': input.kecamatan || 'Garut Kota',
    '{{kategori}}': input.layanan || 'Infrastruktur Publik',
    '{{layanan}}': input.layanan || 'Layanan PUPR',
    '{{deskripsi}}': input.deskripsi || input.judul || '-',
    '{{langkahPenanganan}}': input.langkahPenanganan || 'Segera lakukan koordinasi teknis dan peninjauan lapangan.',
    '{{catatanDisposisi}}': input.catatanDisposisi || 'Diteruskan langsung dari Command Center Dinas PUPR Garut.'
  };

  let res = template;
  for (const [key, val] of Object.entries(replacements)) {
    res = res.split(key).join(String(val));
  }
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const input: ForwardDispatchInput = await req.json();

    if (!input.bidang) {
      return NextResponse.json({
        success: false,
        error: 'Parameter "bidang" wajib diisi.'
      }, { status: 400 });
    }

    // 1. Dapatkan Pengaturan dan Kontak Bidang
    const settings = getLocalSettings();
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Data pengaturan nomor WhatsApp bidang belum tersedia.'
      }, { status: 500 });
    }

    const contact = settings.contacts[input.bidang];
    if (!contact) {
      return NextResponse.json({
        success: false,
        error: `Bidang ${input.bidang} tidak ditemukan.`
      }, { status: 404 });
    }

    const targetWa = (input.targetNomorWa || contact.nomorWa || '').replace(/\D/g, '');
    let cleanWa = targetWa;
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.substring(1);
    }

    if (!cleanWa || cleanWa.length < 9) {
      return NextResponse.json({
        success: false,
        error: `Nomor WhatsApp untuk ${contact.namaBidang} belum dikonfigurasi dengan benar.`
      }, { status: 400 });
    }

    // 2. Format Pesan
    const isPengaduan = input.type === 'PENGADUAN' || input.type === 'DARURAT';
    const rawTemplate = contact.customTemplate || 
      (isPengaduan ? settings.defaultTemplatePengaduan : settings.defaultTemplatePermohonan);

    const formattedMessage = formatForwardText(input, contact.namaBidang, rawTemplate);

    // 3. Kirim Pesan via Baileys API
    let messageId = `fwd-${Date.now()}`;
    let isSuccess = false;
    let errorMessage: string | undefined;

    try {
      const sendRes = await fetch(`${BAILEYS_URL}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-baileys-api-key': BAILEYS_API_KEY
        },
        body: JSON.stringify({
          to: cleanWa,
          text: formattedMessage,
          sender: 'command_center_forwarder'
        })
      });

      const resBody = await sendRes.json().catch(() => ({}));
      if (sendRes.ok) {
        isSuccess = true;
        messageId = resBody?.saved?.id || resBody?.data?.key?.id || messageId;
      } else {
        errorMessage = resBody.error || `Server WhatsApp Baileys merespons kode ${sendRes.status}`;
      }
    } catch (sendErr: unknown) {
      errorMessage = sendErr instanceof Error ? sendErr.message : 'Koneksi ke server Baileys terputus';
    }

    // 4. Opsional: Notifikasi Warga
    let citizenNotified = false;
    if (isSuccess && (input.sendCitizenConfirmation || settings.notifyCitizenOnForward) && input.pelaporPhone) {
      let citizenWa = input.pelaporPhone.replace(/\D/g, '');
      if (citizenWa.startsWith('0')) citizenWa = '62' + citizenWa.substring(1);
      if (citizenWa.length >= 9) {
        try {
          const citizenConfirmationText = 
            `🏛️ *DINAS PEKERJAAN UMUM & PENATAAN RUANG KAB. GARUT*\n` +
            `────────────────────────\n` +
            `Halo Bapak/Ibu *${input.pelaporName || 'Warga Garut'}*,\n\n` +
            `Laporan/Permohonan Anda [${input.ticketNumber || 'Tiket Terdaftar'}] telah resmi *diteruskan (didisposisikan)* langsung ke tim teknis:\n\n` +
            `🏢 *Bidang Tujuan:* ${contact.namaBidang}\n` +
            `👤 *PIC / Koordinator:* ${contact.namaPejabat}\n` +
            `🚨 *Status:* Diteruskan ke WhatsApp Unit Reaksi Cepat / Pelayanan Bidang\n\n` +
            `Tim kami akan menindaklanjuti laporan Anda sesuai SOP Pelayanan PUPR Garut. Terima kasih atas partisipasi aktif Anda. 🙏`;

          await fetch(`${BAILEYS_URL}/api/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-baileys-api-key': BAILEYS_API_KEY
            },
            body: JSON.stringify({
              to: citizenWa,
              text: citizenConfirmationText,
              sender: 'command_center_notifier'
            })
          }).catch(() => null);
          citizenNotified = true;
        } catch {
          // ignore citizen confirmation fail
        }
      }
    }

    // 5. Catat ke History
    const historyItem: ForwardHistoryItem = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketNumber: input.ticketNumber,
      type: input.type,
      bidang: input.bidang,
      targetNomorWa: cleanWa,
      targetName: contact.namaPejabat,
      pelaporName: input.pelaporName,
      judul: input.judul,
      prioritas: input.prioritas || 'NORMAL',
      dispatchedBy: 'Operator Command Center',
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      errorMessage,
      createdAt: new Date().toISOString()
    };

    updateLocalHistoryAndCounter(historyItem);

    const result: ForwardDispatchResult = {
      success: isSuccess,
      messageId,
      bidang: input.bidang,
      targetWa: cleanWa,
      targetName: contact.namaPejabat,
      formattedMessage,
      dispatchedAt: new Date().toISOString(),
      citizenNotified,
      error: errorMessage
    };

    return NextResponse.json(result, { status: isSuccess ? 200 : 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
