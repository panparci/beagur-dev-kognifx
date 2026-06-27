import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  reload: (silent?: boolean) => Promise<void>;
};

export function useAsyncData<T>(
  loader: () => Promise<T>,
  initial: T,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const next = await loaderRef.current();
      setData(next);
      setError(null);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload };
}
