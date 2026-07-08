import { useEffect, useState } from 'react';

const BOOTSTRAP_DELAY_MS = 900;

export function useAppBootstrap(enabled: boolean) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      // Future bootstrap work belongs here:
      // - load fonts
      // - load local storage
      // - initialize database
      // - restore auth session
      // - sync pending offline data
      setIsReady(true);
    }, BOOTSTRAP_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [enabled]);

  return { isReady };
}
