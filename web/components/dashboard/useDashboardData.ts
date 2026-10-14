'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

export function useDashboardData<T>(loadData: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshSeconds, setRefreshSeconds] = useState(() => {
    if (typeof window === 'undefined') return 30;
    const stored = Number(localStorage.getItem('hawk_refresh_interval'));
    return [15, 30, 60].includes(stored) ? stored : 30;
  });

  const reload = useCallback(async () => {
    setError('');
    try {
      setData(await loadData());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.messages.join(', ')
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar os dados.',
      );
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [reload]);

  useEffect(() => {
    const handleInterval = (event: Event) => {
      const seconds = (event as CustomEvent<number>).detail;
      if (Number.isFinite(seconds) && seconds > 0) setRefreshSeconds(seconds);
    };
    window.addEventListener('hawk:refresh-interval', handleInterval);
    return () => window.removeEventListener('hawk:refresh-interval', handleInterval);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => void reload(), refreshSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [refreshSeconds, reload]);

  return { data, loading, error, reload };
}
