import type { GitaIndex, Verse, ChapterCommentary } from './types';

const base = import.meta.env.BASE_URL + 'data/';
const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(base + path).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${path}`);
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p as Promise<T>;
}

const nn = (n: number) => String(n).padStart(2, '0');
export const loadIndex = () => load<GitaIndex>('index.json');
export const loadChapter = (n: number) => load<Verse[]>(`chapters/${nn(n)}.json`);
export const loadCommentary = (n: number) => load<ChapterCommentary>(`commentary/${nn(n)}.json`);

export const allDataPaths = () => {
  const p = ['index.json'];
  for (let i = 1; i <= 18; i++) p.push(`chapters/${nn(i)}.json`, `commentary/${nn(i)}.json`);
  return p.map((x) => base + x);
};

/** Fetch every data file so the service worker caches it for offline use. */
export async function downloadAll(onProgress: (done: number, total: number) => void) {
  const paths = allDataPaths();
  let done = 0;
  for (const url of paths) {
    await fetch(url);
    onProgress(++done, paths.length);
  }
}

export function parseVerseId(id: string) {
  const [c, v] = id.split('.').map(Number);
  return { c, v };
}
export function compareVerseIds(a?: string, b?: string) {
  if (!a) return 1; if (!b) return -1;
  const x = parseVerseId(a), y = parseVerseId(b);
  return x.c - y.c || x.v - y.v;
}
