import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '@/lib/utils';

/** Loads data, tracks loading/error, and ignores results after unmount. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = [], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fnRef.current();
      if (alive.current) setData(r);
    } catch (e) {
      if (alive.current) setError(friendlyError(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => { if (enabled) run(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { data, loading, error, reload: run, setData };
}
