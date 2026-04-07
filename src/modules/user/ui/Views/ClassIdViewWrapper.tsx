'use client';

import { useEffect, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export default function ClassIdViewWrapper({ children }: { children: React.ReactNode }) {
  const { setOpen } = useSidebar();
  const hasInitializedRef = useRef(false);
  const previousStateRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    previousStateRef.current = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sidebar_state='))
      ?.split('=')[1];

    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    return () => {
      if (previousStateRef.current !== undefined) {
        document.cookie = `sidebar_state=${previousStateRef.current}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
    };
  }, []);

  return <>{children}</>;
}
