import { NextRequest, NextResponse } from 'next/server';
import { SipekaService } from '@/sipeka/services/sipekaService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const users = SipekaService.getMasterUsers();
    const user = users.find((u) => u.username === username || u.email === username);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kredensial atau akun ASN/Pengelola tidak ditemukan.' },
        { status: 401 }
      );
    }

    // Mock session token (SPBE Single Sign-On Garut)
    const token = `sipeka_jwt_${user.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: 'Autentikasi SIPEKA berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama_lengkap,
          nip: user.nip,
          role: user.role,
          instansiId: user.instansi_id,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

