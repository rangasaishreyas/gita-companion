import { useEffect, useState } from 'react';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, set] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
  useEffect(() => {
    let live = true;
    set((s) => ({ data: s.data, loading: true }));
    fn().then((data) => live && set({ data, loading: false }), (error) => live && set({ error, loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
