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

// ---- second source: vedicscriptures/bhagavad-gita-data (GPL-3), English commentaries + Prabhupada ----
const VS = 'https://raw.githubusercontent.com/vedicscriptures/bhagavad-gita-data/main/slok/';
await mkdir(path.join(CACHE, 'vs'), { recursive: true });
async function getVs(c, v) {
  const p = path.join(CACHE, 'vs', `${c}_${v}.json`);
  try { return JSON.parse(await readFile(p, 'utf8')); } catch {}
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`${VS}bhagavadgita_chapter_${c}_slok_${v}.json`);
    if (r.ok) { const txt = await r.text(); await writeFile(p, txt); return JSON.parse(txt); }
    if (r.status === 404) return null;
    await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
  }
  throw new Error(`vs ${c}.${v} failed`);
}
/** Long single-paragraph prose → paragraphs of a few sentences each. */
function paragraphs(s) {
  const sentences = s.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+["'’”)]*\s*|[^.!?]+$/g) ?? [s];
  const out = []; let cur = '';
  for (const x of sentences) { cur += x; if (cur.length > 450) { out.push(cur.trim()); cur = ''; } }
  if (cur.trim()) out.push(cur.trim());
  return out.join('\n\n');
}
const vsT = [{ key: 'prabhu', field: 'et', id: 'vs-prabhu:english', author: 'A.C. Bhaktivedanta Swami Prabhupada' }];
const vsC = [
  { key: 'sankar', field: 'et', id: 'vs-sankar:english', author: 'Sri Shankaracharya (tr. Gambhirananda)' },
  { key: 'raman', field: 'et', id: 'vs-raman:english', author: 'Sri Ramanujacharya (tr. Adidevananda)' },
  { key: 'abhinav', field: 'et', id: 'vs-abhinav:english', author: 'Sri Abhinavagupta' },
  { key: 'prabhu', field: 'ec', id: 'vs-prabhu:english', author: 'A.C. Bhaktivedanta Swami Prabhupada (purport)' },
];
const jobs = verses.map((v) => [v.chapter_number, v.verse_number, v.id]);
let vsHits = 0;
for (let i = 0; i < jobs.length; i += 8) {
  const batch = await Promise.all(jobs.slice(i, i + 8).map(([c, v, id]) => getVs(c, v).then((d) => [id, d])));
  for (const [id, d] of batch) {
    if (!d) continue; vsHits++;
    for (const s of vsT) {
      const t = d[s.key]?.[s.field]; if (!t?.trim()) continue;
      usedT.set(s.id, { id: s.id, author: s.author, lang: 'english' });
      (tByVerse.get(id) ?? tByVerse.set(id, []).get(id)).push({ a: s.id, t: stripNum(t) });
    }
    for (const s of vsC) {
      const t = d[s.key]?.[s.field]; if (!t?.trim() || /^no commentary\.?$/i.test(stripNum(t))) continue;
      usedC.set(s.id, { id: s.id, author: s.author, lang: 'english' });
      (cByVerse.get(id) ?? cByVerse.set(id, []).get(id)).push({ a: s.id, t: paragraphs(stripNum(t)) });
    }
  }
  if (i % 160 === 0) console.log(`vedicscriptures: ${i + 8}/${jobs.length}`);
}
console.log('vedicscriptures verses merged:', vsHits);

const index = {
  source: 'github.com/gita/gita (Unlicense) + github.com/vedicscriptures/bhagavad-gita-data (GPL-3.0)',
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
    sa: clean(v.text).replace(/\n\n/g, '\n').replace(/(उवाच|ुवाच)[ \t]*(?=[^\s।])/g, '$1\n').replace(/।(?=[^\s।\d])/g, '।\n'), tr: clean(v.transliteration), wm: clean(v.word_meanings),
    t: tByVerse.get(v.id) ?? [],
  }));
  const cOut = Object.fromEntries(vs.map((v) => [v.verse_number, cByVerse.get(v.id) ?? []]));
  const nn = String(ch.n).padStart(2, '0');
  await writeFile(path.join(OUT, 'chapters', `${nn}.json`), JSON.stringify(chOut));
  await writeFile(path.join(OUT, 'commentary', `${nn}.json`), JSON.stringify(cOut));
}
console.log(`chapters: ${index.chapters.length}, verses: ${total}, translators: ${usedT.size}, commentators: ${usedC.size}`);
