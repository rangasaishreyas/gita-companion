/**
 * Single data-access layer. UI code only talks to this module, so a sync
 * backend can later be added here without touching screens.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Base, type ReadStatus, type Bookmark, type Highlight, type Note, type UserAnecdote, type JournalEntry } from './schema';
import { parseVerseId } from '../data/loader';
import type { ThemeDef } from '../styles/themes';

const now = () => Date.now();
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + now().toString(36));
const chapterOf = (verseId: string) => parseVerseId(verseId).c;
const alive = <T extends Base>(rows: T[]) => rows.filter((r) => !r.deleted);

type Draft<T extends Base> = Omit<T, keyof Base> & Partial<Pick<Base, 'id'>>;
type SoftTable = 'bookmarks' | 'highlights' | 'notes' | 'anecdotes' | 'journal';

async function upsert<T extends Base>(table: SoftTable, draft: Draft<T>): Promise<string> {
  const t = db.table<T, string>(table);
  const existing = draft.id ? await t.get(draft.id) : undefined;
  const id = draft.id ?? uid();
  const rec = { ...(existing ?? {}), ...draft, id, createdAt: existing?.createdAt ?? now(), updatedAt: now(), deleted: 0 } as T;
  await t.put(rec);
  return id;
}
async function softDelete(table: SoftTable, id: string) {
  await db.table(table).update(id, { deleted: 1, updatedAt: now() });
}

// ---------- progress ----------
export async function setStatus(verseId: string, status: ReadStatus) {
  const prev = await db.progress.get(verseId);
  await db.progress.put({
    verseId, chapter: chapterOf(verseId), status, updatedAt: now(),
    firstReadAt: prev?.firstReadAt ?? (status === 'read' ? now() : undefined),
  });
}
/** Marks read only if the verse has no explicit status yet (won't override "revisit"/"unread"). */
export async function autoMarkRead(verseId: string) {
  const prev = await db.progress.get(verseId);
  if (!prev) await setStatus(verseId, 'read');
}
export async function setChapterStatus(chapter: number, verseCount: number, status: ReadStatus) {
  await db.transaction('rw', db.progress, async () => {
    for (let v = 1; v <= verseCount; v++) await setStatus(`${chapter}.${v}`, status);
  });
}
export const useProgress = () => useLiveQuery(() => db.progress.toArray(), [], []);
export const useVerseStatus = (verseId: string) =>
  useLiveQuery(async () => (await db.progress.get(verseId))?.status ?? 'unread', [verseId], 'unread' as ReadStatus);

// ---------- bookmarks ----------
export const useBookmarks = () => useLiveQuery(async () => alive(await db.bookmarks.toArray()), [], []);
export const useIsBookmarked = (verseId: string) =>
  useLiveQuery(async () => alive(await db.bookmarks.where('verseId').equals(verseId).toArray()).length > 0, [verseId], false);
export async function toggleBookmark(verseId: string) {
  const rows = alive(await db.bookmarks.where('verseId').equals(verseId).toArray());
  if (rows.length) for (const r of rows) await softDelete('bookmarks', r.id);
  else await upsert<Bookmark>('bookmarks', { verseId, chapter: chapterOf(verseId) });
}

// ---------- highlights ----------
export const useHighlights = (verseId?: string) =>
  useLiveQuery(async () => alive(verseId ? await db.highlights.where('verseId').equals(verseId).toArray() : await db.highlights.toArray()), [verseId], []);
export const saveHighlight = (h: Draft<Highlight>) => upsert<Highlight>('highlights', h);
export const deleteHighlight = (id: string) => softDelete('highlights', id);

// ---------- notes ----------
export const useNotes = (verseId?: string) =>
  useLiveQuery(async () => alive(verseId ? await db.notes.where('verseId').equals(verseId).toArray() : await db.notes.toArray()), [verseId], []);
export const saveNote = (n: Draft<Note>) => upsert<Note>('notes', { ...n, chapter: n.verseId ? chapterOf(n.verseId) : undefined });
export const deleteNote = (id: string) => softDelete('notes', id);

// ---------- user anecdotes ----------
export const useUserAnecdotes = (verseId?: string) =>
  useLiveQuery(async () => alive(verseId ? await db.anecdotes.where('verseId').equals(verseId).toArray() : await db.anecdotes.toArray()), [verseId], []);
export const saveAnecdote = (a: Draft<UserAnecdote>) => upsert<UserAnecdote>('anecdotes', a);
export const deleteAnecdote = (id: string) => softDelete('anecdotes', id);

// ---------- journal ----------
export const useJournal = () =>
  useLiveQuery(async () => alive(await db.journal.toArray()).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt), [], []);
export const useJournalEntry = (id?: string) =>
  useLiveQuery(async () => (id ? db.journal.get(id) : undefined), [id]);
export const useJournalForVerse = (verseId: string) =>
  useLiveQuery(async () => alive(await db.journal.where('verseIds').equals(verseId).toArray()), [verseId], []);
export const saveJournal = (j: Draft<JournalEntry>) => upsert<JournalEntry>('journal', j);
export const deleteJournal = (id: string) => softDelete('journal', id);

// ---------- settings ----------
export interface Settings {
  /** 'system', a preset id, or a custom theme id */
  theme: string;
  systemLight: string;
  systemDark: string;
  customThemes: ThemeDef[];
  /** collab profile & preferences */
  collabName: string;
  collabColor: string;
  showCursors: boolean;
  shareCursor: boolean;
  fontScale: number;
  showTranslit: boolean;
  showWordMeanings: boolean;
  defaultTranslator: string;
  pinnedTranslators: string[];
  commentaryLangs: Array<'english' | 'hindi' | 'sanskrit'>;
  lastCommentator?: string;
  lastPosition?: string;
  autoMarkRead: boolean;
}
export const defaultSettings: Settings = {
  theme: 'system', systemLight: 'saffron', systemDark: 'night', customThemes: [],
  collabName: '', collabColor: '#e4572e', showCursors: true, shareCursor: true,
  fontScale: 1, showTranslit: true, showWordMeanings: false,
  defaultTranslator: '16:english', pinnedTranslators: ['16:english', '19:english', '1:hindi'],
  commentaryLangs: ['english', 'hindi', 'sanskrit'], autoMarkRead: true, lastCommentator: 'vs-sankar:english',
};
export function useSettings(): Settings {
  const rows = useLiveQuery(() => db.settings.toArray(), [], undefined);
  const s = { ...defaultSettings } as Record<string, unknown>;
  for (const r of rows ?? []) s[r.key] = r.value;
  return s as unknown as Settings;
}
export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.settings.put({ key, value });
}
