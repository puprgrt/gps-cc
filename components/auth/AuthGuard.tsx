"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/domain/models';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    // Tunggu sampai auth diinisialisasi
    if (!isInitialized) return;

    // Jika tidak login dan bukan di halaman login, redirect ke login
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
      return;
    }

    // Jika sudah login dan mencoba akses halaman login, redirect ke dashboard (/)
    if (isAuthenticated && pathname === '/login') {
      router.push('/');
      return;
    }

    // Pengecekan Role (RBAC)
    if (isAuthenticated && user && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect ke unauthorized page atau dashboard utama (/)
        router.push('/'); 
      }
    }
  }, [isInitialized, isAuthenticated, user, router, pathname, allowedRoles]);

  // Tampilkan loading spinner saat inisialisasi awal
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-garut-blue" />
          <p className="text-sm font-medium text-gray-500">Memuat sesi Anda...</p>
        </div>
      </div>
    );
  }

  // Mencegah flash konten yang dilindungi sebelum redirect bekerja
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
