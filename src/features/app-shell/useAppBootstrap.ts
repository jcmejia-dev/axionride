import { useEffect, useState } from 'react';
import { initializeDatabase } from '@/src/storage/sqlite';

const BOOTSTRAP_DELAY_MS = 900;

export function useAppBootstrap(enabled: boolean) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      // Future bootstrap work belongs here:
      // - load fonts
      // - load local storage
      // - initialize database
      // - restore auth session
      // - sync pending offline data
      void initializeDatabase().then(() => {
        if (!cancelled) setIsReady(true);
      });
    }, BOOTSTRAP_DELAY_MS);

    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [enabled]);

  return { isReady };
}
