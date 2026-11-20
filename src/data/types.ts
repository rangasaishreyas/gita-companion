export interface ChapterMeta {
  n: number; name: string; translit: string; meaning: string;
  summary: string; summaryHi: string; verses: number;
}
export interface Author { id: string; author: string; lang: 'english' | 'hindi' | 'sanskrit' }
export interface GitaIndex { source: string; chapters: ChapterMeta[]; translators: Author[]; commentators: Author[] }
export interface TextBy { a: string; t: string }
export interface Verse { n: number; id: string; sa: string; tr: string; wm: string; t: TextBy[] }
export type ChapterCommentary = Record<string, TextBy[]>;
