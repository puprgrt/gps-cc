import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';

// Tentukan route API yang TIDAK MEMERLUKAN autentikasi (publik/webhook)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/psic/webhook',
  '/api/psic/chatwoot',
  '/api/whatsapp/baileys',
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya periksa rute /api/
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Izinkan akses ke rute publik TANPA memeriksa auth (mencegah crash jose/Edge)
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Untuk rute non-publik, periksa autentikasi via NextAuth
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Server-side session is required.' },
        { status: 401 }
      );
    }

    // RBAC check: Jika route mengandung "settings" atau "orchestrator", bisa dibatasi hanya admin
    if (pathname.includes('/settings') || pathname.includes('/orchestrator/cost')) {
      const role = (session.user as Record<string, unknown>)?.role;
      if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Forbidden. Admin role is required.' },
          { status: 403 }
        );
      }
    }
  } catch (error) {
    // Jika auth() gagal (jose/Edge Runtime issue), tolak secara graceful
    console.error('[Middleware] Auth check failed:', error);
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable.' },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  // Hanya jalankan middleware untuk rute API
  matcher: ['/api/:path*'],
};
