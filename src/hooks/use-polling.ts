'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval: number;
  enabled?: boolean;
  onData?: (data: T) => void;
}

/**
 * Hook de polling inteligente con intervalo adaptativo.
 * - 10s para estados activos (PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY)
 * - 30s para otros estados activos
 * - Desactivado para estados terminales
 */
export function usePolling<T>(options: UsePollingOptions<T>) {
  const { fetcher, interval, enabled = true, onData } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetcherRef = useRef(fetcher);
  const onDataRef = useRef(onData);

  // Keep refs up to date
  fetcherRef.current = fetcher;
  onDataRef.current = onData;

  const doFetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      onDataRef.current?.(result);
    } catch {
      // Silently fail on polling errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    doFetch();

    // Set up interval
    intervalRef.current = setInterval(doFetch, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, doFetch]);

  return { data, isLoading };
}
