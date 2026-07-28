import { NextRequest, NextResponse } from 'next/server';

// Route API yang TIDAK MEMERLUKAN autentikasi (publik/webhook)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/psic/webhook',
  '/api/psic/chatwoot',
  '/api/whatsapp/baileys',
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Middleware Edge-compatible yang TIDAK mengimpor next-auth/jose.
 * 
 * Strategi: Periksa keberadaan session cookie NextAuth sebagai bukti autentikasi.
 * Validasi JWT yang lebih dalam dilakukan di masing-masing API route handler 
 * menggunakan `auth()` dari auth.ts (yang berjalan di Node.js runtime, bukan Edge).
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya periksa rute /api/
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Izinkan akses ke rute publik tanpa pemeriksaan apapun
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Periksa keberadaan session cookie NextAuth v5
  // NextAuth v5 menggunakan nama cookie "authjs.session-token" (development)
  // atau "__Secure-authjs.session-token" (production/HTTPS)
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Unauthorized. Session cookie is required.' },
      { status: 401 }
    );
  }

  // Cookie ada — izinkan request berlanjut ke API route handler
  // Validasi JWT mendalam dilakukan di sisi server (bukan Edge)
  return NextResponse.next();
}

export const config = {
  // Hanya jalankan middleware untuk rute API
  matcher: ['/api/:path*'],
};
