import { NextRequest, NextResponse } from 'next/server';
import { delegatedStorageService } from '@/sipeka/storage/googleDriveStorage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const instansiNpsn = (formData.get('instansiNpsn') as string) || 'NPSN-20224001';
    const bangunanNup = (formData.get('bangunanNup') as string) || 'BMD-01';
    const bangunanNama = (formData.get('bangunanNama') as string) || 'Bangunan Gedung';
    const permohonanId = (formData.get('permohonanId') as string) || 'REQ-UNKNOWN';
    const userOAuthToken = (formData.get('userOAuthToken') as string) || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Berkas foto tidak ditemukan.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const metadata = await delegatedStorageService.uploadToApplicantDrive({
      userOAuthToken,
      instansiNpsn,
      bangunanNup,
      bangunanNama,
      permohonanId,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      fileBuffer: buffer,
    });

    return NextResponse.json({
      success: true,
      message: 'Foto berhasil disimpan di Google Drive Pengelola (Kuota PUPR: 0 MB). Metadata tersimpan di database.',
      data: metadata,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengunggah ke Google Drive Delegated Storage.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

