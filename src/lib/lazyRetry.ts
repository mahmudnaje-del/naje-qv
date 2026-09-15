import React, { ComponentType, lazy } from 'react';

/**
 * Wraps dynamic imports with retry mechanism to gracefully handle network drops,
 * Vite dev server restarts, and stale cached chunk requests.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retriesLeft = 2,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error) => {
      if (retriesLeft <= 0) {
        // If dynamic import still fails after retries, try a window reload once if not already reloaded
        const isModuleFetchError = error?.message?.includes?.('Failed to fetch dynamically imported module') ||
                                   error?.message?.includes?.('Importing a module script failed');
        
        if (isModuleFetchError && typeof window !== 'undefined') {
          const sessionKey = `retry_reload_${window.location.pathname}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
        }
        throw error;
      }

      return new Promise<{ default: T }>((resolve) => {
        setTimeout(() => {
          resolve(
            factory().catch((err) => {
              if (retriesLeft - 1 > 0) {
                return (lazyWithRetry(factory, retriesLeft - 1, interval) as any)._payload._result;
              }
              throw err;
            })
          );
        }, interval);
      });
    })
  );
}
