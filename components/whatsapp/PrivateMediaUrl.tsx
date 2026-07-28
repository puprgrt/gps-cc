'use client';

import { useEffect, useState } from 'react';

interface PrivateMediaUrlProps {
  storagePath?: string;
  fallbackUrl?: string;
  children: (url: string | undefined, isLoading: boolean) => React.ReactNode;
}

export function PrivateMediaUrl({ storagePath, fallbackUrl, children }: PrivateMediaUrlProps) {
  const [result, setResult] = useState<{ path: string; url?: string }>();

  useEffect(() => {
    if (!storagePath) return;

    let cancelled = false;

    fetch(`/api/whatsapp/media-url?path=${encodeURIComponent(storagePath)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Media tidak dapat diakses.');
        return response.json() as Promise<{ signedUrl: string }>;
      })
      .then((data) => {
        if (!cancelled) setResult({ path: storagePath, url: data.signedUrl });
      })
      .catch(() => {
        if (!cancelled) setResult({ path: storagePath });
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  const isPrivateMedia = Boolean(storagePath);
  const hasResultForCurrentPath = result?.path === storagePath;
  const url = isPrivateMedia ? (hasResultForCurrentPath ? result?.url : undefined) : fallbackUrl;
  const isLoading = isPrivateMedia && !hasResultForCurrentPath;
  return <>{children(url, isLoading)}</>;
}
