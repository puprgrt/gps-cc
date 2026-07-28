import { NextResponse } from 'next/server';
import { auth } from './auth';

// Tentukan route API yang TIDAK MEMERLUKAN autentikasi (publik/webhook)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/psic/webhook',
  '/api/psic/chatwoot',
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Hanya periksa rute /api/
  if (nextUrl.pathname.startsWith('/api/')) {
    const isPublicRoute = PUBLIC_API_ROUTES.some((route) =>
      nextUrl.pathname.startsWith(route)
    );

    if (!isPublicRoute && !isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized. Server-side session is required.' },
        { status: 401 }
      );
    }
    
    // RBAC check: Jika route mengandung "settings" atau "orchestrator", bisa dibatasi hanya admin
    if (isLoggedIn && (nextUrl.pathname.includes('/settings') || nextUrl.pathname.includes('/orchestrator/cost'))) {
       const role = (req.auth?.user as any)?.role;
       if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
         return NextResponse.json(
           { error: 'Forbidden. Admin role is required.' },
           { status: 403 }
         );
       }
    }
  }

  return NextResponse.next();
});

export const config = {
  // Hanya jalankan middleware untuk rute API
  matcher: ['/api/:path*'],
};
