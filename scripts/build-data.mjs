// Downloads the public-domain gita/gita dataset and splits it per chapter.
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://raw.githubusercontent.com/gita/gita/main/data/';
const FILES = ['chapters.json', 'verse.json', 'translation.json', 'commentary.json', 'authors.json'];
const CACHE = '.cache';
const OUT = 'public/data';

async function get(name) {
  const p = path.join(CACHE, name);
  try { await access(p); } catch {
    console.log('downloading', name);
    const r = await fetch(BASE + name);
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    await writeFile(p, Buffer.from(await r.arrayBuffer()));
  }
  return JSON.parse(await readFile(p, 'utf8'));
}

const clean = (s) => (s ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const stripNum = (s) => clean(s).replace(/^[।\s]*\d+(\.\d+)*[।\s]*/, '').trim();
// Commentary text in the source has lost paragraph breaks and (for Sivananda) commas became "?".
function cleanCommentary(raw, lang) {
  let s = stripNum(raw).replace(/^(व्याख्या|Commentary)?\s*[-—]+\s*/, '');
  if (lang === 'english') {
    s = s.replace(/\?(?=\s+[a-z\u0900-\u097F(])/g, ',');
    s = s.replace(/\.?Commentary\s+/, '\n\nCommentary\n');
    s = s.replace(/([a-z\)][.!?;])([A-Z])/g, '$1\n\n$2');
    s = s.replace(/([a-z])([A-Z][a-z]+ )/g, (m, a, b) => a + '.\n\n' + b);
  } else {
    s = s.replace(/([।?!])(?=[^\s।\d'"’”)])/g, '$1 ');
  }
  return s.trim();
}

await mkdir(CACHE, { recursive: true });
await mkdir(path.join(OUT, 'chapters'), { recursive: true });
await mkdir(path.join(OUT, 'commentary'), { recursive: true });

const [chapters, verses, translations, commentaries, authors] = await Promise.all(FILES.map(get));

const verseById = new Map(verses.map((v) => [v.id, v]));
const usedT = new Map(), usedC = new Map();
const tByVerse = new Map(), cByVerse = new Map();
for (const t of translations) {
  const v = verseById.get(t.verse_id); if (!v) continue;
  const key = `${t.author_id}:${t.lang}`;
  usedT.set(key, { id: key, author: t.authorName, lang: t.lang });
  (tByVerse.get(v.id) ?? tByVerse.set(v.id, []).get(v.id)).push({ a: key, t: stripNum(t.description) });
}
for (const c of commentaries) {
  const v = verseById.get(c.verse_id); if (!v) continue;
  const key = `${c.author_id}:${c.lang}`;
  usedC.set(key, { id: key, author: c.authorName, lang: c.lang });
  (cByVerse.get(v.id) ?? cByVerse.set(v.id, []).get(v.id)).push({ a: key, t: cleanCommentary(c.description, c.lang) });
}

const index = {
  source: 'github.com/gita/gita (Unlicense, public domain)',
  chapters: chapters.sort((a, b) => a.chapter_number - b.chapter_number).map((c) => ({
    n: c.chapter_number, name: c.name, translit: c.name_transliterated, meaning: c.name_meaning,
    summary: clean(c.chapter_summary), summaryHi: clean(c.chapter_summary_hindi), verses: c.verses_count,
  })),
  translators: [...usedT.values()],
  commentators: [...usedC.values()],
};
await writeFile(path.join(OUT, 'index.json'), JSON.stringify(index));

let total = 0;
for (const ch of index.chapters) {
  const vs = verses.filter((v) => v.chapter_number === ch.n).sort((a, b) => a.verse_number - b.verse_number);
  total += vs.length;
  const chOut = vs.map((v) => ({
    n: v.verse_number, id: `${ch.n}.${v.verse_number}`,
    sa: clean(v.text).replace(/\n\n/g, '\n'), tr: clean(v.transliteration), wm: clean(v.word_meanings),
    t: tByVerse.get(v.id) ?? [],
  }));
  const cOut = Object.fromEntries(vs.map((v) => [v.verse_number, cByVerse.get(v.id) ?? []]));
  const nn = String(ch.n).padStart(2, '0');
  await writeFile(path.join(OUT, 'chapters', `${nn}.json`), JSON.stringify(chOut));
  await writeFile(path.join(OUT, 'commentary', `${nn}.json`), JSON.stringify(cOut));
}
console.log(`chapters: ${index.chapters.length}, verses: ${total}, translators: ${usedT.size}, commentators: ${usedC.size}`);
