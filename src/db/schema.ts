import Dexie, { type Table } from 'dexie';

/** Every record carries these so a sync backend can merge by updatedAt later. */
export interface Base { id: string; createdAt: number; updatedAt: number; deleted?: 0 | 1 }

export type ReadStatus = 'read' | 'unread' | 'revisit';
export interface Progress { verseId: string; chapter: number; status: ReadStatus; updatedAt: number; firstReadAt?: number }
export interface Bookmark extends Base { verseId: string; chapter: number }
export type HighlightColor = 'saffron' | 'green' | 'blue' | 'rose';
export interface Highlight extends Base {
  verseId: string; chapter: number; source: string; sourceLabel: string;
  start: number; end: number; text: string; color: HighlightColor; note?: string;
}
export type NoteKind = 'observation' | 'learning' | 'question';
export interface Note extends Base { verseId?: string; chapter?: number; kind: NoteKind; body: string; tags: string[] }
export interface UserAnecdote extends Base { verseId: string; chapter: number; title: string; body: string; source: string }
export interface JournalEntry extends Base { date: string; title: string; body: string; verseIds: string[]; tags: string[]; mood?: string }
export interface Setting { key: string; value: unknown }

class GitaDB extends Dexie {
  progress!: Table<Progress, string>;
  bookmarks!: Table<Bookmark, string>;
  highlights!: Table<Highlight, string>;
  notes!: Table<Note, string>;
  anecdotes!: Table<UserAnecdote, string>;
  journal!: Table<JournalEntry, string>;
  settings!: Table<Setting, string>;
  constructor() {
    super('gita-companion');
    this.version(1).stores({
      progress: 'verseId, chapter, status, updatedAt',
      bookmarks: 'id, verseId, chapter, updatedAt',
      highlights: 'id, verseId, chapter, updatedAt',
      notes: 'id, verseId, chapter, kind, updatedAt, *tags',
      anecdotes: 'id, verseId, chapter, updatedAt',
      journal: 'id, date, updatedAt, *verseIds, *tags',
      settings: 'key',
    });
  }
}

export const db = new GitaDB();
export const userTables = ['progress', 'bookmarks', 'highlights', 'notes', 'anecdotes', 'journal', 'settings'] as const;
