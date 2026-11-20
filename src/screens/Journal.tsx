import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';
import { useJournal, useJournalEntry, saveJournal, deleteJournal } from '../db/repo';
import { loadIndex } from '../data/loader';
import { useAsync } from '../data/useAsync';

export const moods = ['Peaceful', 'Grateful', 'Seeking', 'Inspired', 'Restless', 'Heavy'];
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export function JournalList() {
  const entries = useJournal();
  const [q, setQ] = useState('');
  const shown = entries.filter((e) => !q || `${e.title} ${e.body} ${e.tags.join(' ')} ${e.verseIds.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  const groups = useMemo(() => {
    const m = new Map<string, typeof shown>();
    for (const e of shown) { const k = new Date(e.date + 'T00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); (m.get(k) ?? m.set(k, []).get(k)!).push(e); }
    return [...m];
  }, [shown]);
  return (
    <>
      <TopBar title="Journal" />
      <div className="page">
        {entries.length > 0 && (
          <div className="search" style={{ margin: '4px 0 8px' }}><Icon name="search" />
            <input className="field" placeholder="Search your journal" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        {groups.map(([month, list]) => (
          <div key={month}>
            <div className="section-title">{month}</div>
            {list.map((e) => (
              <Link to={`/journal/${e.id}`} key={e.id} className="card note" style={{ display: 'block' }}>
                <div className="jdate">{fmt(e.date)}{e.mood ? ` · ${e.mood}` : ''}</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1.08rem', marginTop: 4 }}>{e.title || 'Untitled entry'}</div>
                <div className="body clamp" style={{ WebkitLineClamp: 3 }}>{e.body}</div>
                <div className="meta">
                  {e.verseIds.map((v) => <span key={v} className="verse-ref">{v}</span>)}
                  {e.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
              </Link>
            ))}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="empty">
            <div className="glyph">✍︎</div>
            <p>Your journal is empty.</p>
            <p className="small">Write about a verse that moved you, a question you're living with, or how a teaching showed up in your day.</p>
            <Link className="btn" to="/journal/new" style={{ marginTop: 8 }}>Write your first entry</Link>
          </div>
        )}
      </div>
      {entries.length > 0 && <Link to="/journal/new" className="fab" aria-label="New journal entry"><Icon name="plus" /></Link>}
    </>
  );
}

export function JournalEditor() {
  const { id: routeId } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const isNew = routeId === 'new';
  const existing = useJournalEntry(isNew ? undefined : routeId);
  const index = useAsync(loadIndex, []);
  const [id, setId] = useState<string | undefined>(isNew ? undefined : routeId);
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [verseIds, setVerseIds] = useState<string[]>(params.get('verse') ? [params.get('verse')!] : []);
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<string | undefined>();
  const [verseInput, setVerseInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const loaded = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (existing && !loaded.current) {
      loaded.current = true;
      setDate(existing.date); setTitle(existing.title); setBody(existing.body); setVerseIds(existing.verseIds); setTags(existing.tags); setMood(existing.mood);
    }
  }, [existing]);

  // autosave (debounced) once there is content
  useEffect(() => {
    if (!dirty.current) return;
    if (!title.trim() && !body.trim()) return;
    const t = window.setTimeout(async () => {
      const newId = await saveJournal({ id, date, title: title.trim(), body, verseIds, tags, mood });
      if (!id) { loaded.current = true; setId(newId); nav(`/journal/${newId}`, { replace: true }); }
    }, 700);
    return () => clearTimeout(t);
  }, [date, title, body, verseIds, tags, mood]); // eslint-disable-line react-hooks/exhaustive-deps

  const touch = <T,>(fn: (v: T) => void) => (v: T) => { dirty.current = true; fn(v); };
  const validVerse = (s: string) => {
    const m = s.trim().match(/^(\d{1,2})[.:\s](\d{1,3})$/);
    if (!m) return null;
    const ch = index.data?.chapters.find((c) => c.n === Number(m[1]));
    return ch && Number(m[2]) >= 1 && Number(m[2]) <= ch.verses ? `${ch.n}.${Number(m[2])}` : null;
  };
  const addVerse = () => {
    const v = validVerse(verseInput);
    if (!v) { toast('Enter a verse like 2.47'); return; }
    if (!verseIds.includes(v)) touch(setVerseIds)([...verseIds, v]);
    setVerseInput('');
  };
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) touch(setTags)([...tags, t]);
    setTagInput('');
  };

  if (!isNew && existing === undefined && !loaded.current) return <><TopBar back="/journal" title="Journal" /><div className="empty">Loading…</div></>;

  return (
    <>
      <TopBar back="/journal" title={isNew && !id ? 'New entry' : 'Journal entry'}
        actions={id ? <button className="iconbtn" aria-label="Delete entry" onClick={async () => {
          if (confirm('Delete this journal entry?')) { await deleteJournal(id); toast('Entry deleted'); nav('/journal', { replace: true }); }
        }}><Icon name="trash" /></button> : undefined} />
      <div className="page stack" style={{ paddingTop: 8 }}>
        <input type="date" className="field" value={date} onChange={(e) => touch(setDate)(e.target.value)} />
        <input className="field" style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 600 }} placeholder="Title" value={title} onChange={(e) => touch(setTitle)(e.target.value)} />
        <textarea className="field" style={{ minHeight: '40dvh', fontFamily: 'var(--serif)', fontSize: '1.02rem' }} autoFocus={isNew}
          placeholder="What stayed with you? What did you notice in yourself today?" value={body} onChange={(e) => touch(setBody)(e.target.value)} />

        <div>
          <div className="section-title" style={{ marginTop: 8 }}>How do you feel?</div>
          <div className="chips">{moods.map((m) => <button key={m} className={'chip' + (mood === m ? ' on' : '')} onClick={() => touch(setMood)(mood === m ? undefined : m)}>{m}</button>)}</div>
        </div>

        <div>
          <div className="section-title" style={{ marginTop: 8 }}>Linked verses</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {verseIds.map((v) => (
              <span key={v} className="verse-ref">
                <Link to={`/read/${v.replace('.', '/')}`}>{v}</Link>
                <button aria-label={`Unlink ${v}`} onClick={() => touch(setVerseIds)(verseIds.filter((x) => x !== v))} style={{ display: 'inline-flex', width: 14 }}><Icon name="close" /></button>
              </span>
            ))}
          </div>
          <div className="row">
            <input className="field" inputMode="decimal" placeholder="e.g. 2.47" value={verseInput} onChange={(e) => setVerseInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addVerse()} />
            <button className="btn secondary" onClick={addVerse}>Link</button>
          </div>
        </div>

        <div>
          <div className="section-title" style={{ marginTop: 8 }}>Tags</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.map((t) => <button key={t} className="chip" onClick={() => touch(setTags)(tags.filter((x) => x !== t))}>#{t} ✕</button>)}
          </div>
          <div className="row">
            <input className="field" placeholder="Add a tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} />
            <button className="btn secondary" onClick={addTag}>Add</button>
          </div>
        </div>
        <p className="small muted" style={{ textAlign: 'center' }}>{id ? 'Saved automatically' : 'Starts saving as soon as you write'}</p>
      </div>
    </>
  );
}
