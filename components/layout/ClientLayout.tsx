'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useSidebar } from '@/hooks/useSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SessionProvider } from 'next-auth/react';
import { cn } from '@/lib/utils';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');

  if (isLoginPage) {
    return (
      <SessionProvider>
        <AuthGuard>
          <main className="w-full min-h-screen">
            {children}
          </main>
        </AuthGuard>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <AuthGuard>
        <Sidebar />
        <div className={cn("flex flex-col min-h-screen transition-all duration-300 ease-in-out", isCollapsed ? "md:pl-[80px]" : "md:pl-[260px]")}>
          <Topbar />
          <main className="flex-1 p-6 pt-2">
            {children}
          </main>
        </div>
      </AuthGuard>
    </SessionProvider>
  );
}
