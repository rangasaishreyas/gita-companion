import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { NoteEditor, HighlightEditor, AnecdoteEditor, noteKinds } from '../components/Editors';
import { useBookmarks, useHighlights, useNotes, useUserAnecdotes, useJournal } from '../db/repo';
import { compareVerseIds } from '../data/loader';
import type { Highlight, Note, UserAnecdote } from '../db/schema';

type Kind = 'all' | 'bookmark' | 'highlight' | 'observation' | 'learning' | 'question' | 'anecdote' | 'journal';
interface Item { key: string; kind: Exclude<Kind, 'all'>; verseId?: string; at: number; text: string; tags: string[]; render: () => React.ReactNode }

const filters: Array<{ k: Kind; label: string }> = [
  { k: 'all', label: 'All' }, { k: 'bookmark', label: 'Bookmarks' }, { k: 'highlight', label: 'Highlights' },
  { k: 'observation', label: 'Observations' }, { k: 'learning', label: 'Learnings' }, { k: 'question', label: 'Questions' },
  { k: 'anecdote', label: 'My stories' }, { k: 'journal', label: 'Journal' },
];

export function Library() {
  const bookmarks = useBookmarks(), highlights = useHighlights(), notes = useNotes(), anecdotes = useUserAnecdotes(), journal = useJournal();
  const [kind, setKind] = useState<Kind>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'recent' | 'verse'>('recent');
  const [editNote, setEditNote] = useState<Note>();
  const [editHl, setEditHl] = useState<Highlight>();
  const [editAnec, setEditAnec] = useState<UserAnecdote>();

  const items: Item[] = useMemo(() => {
    const ref = (v?: string) => v && <Link className="verse-ref" to={`/read/${v.replace('.', '/')}`}>{v}</Link>;
    const date = (t: number) => new Date(t).toLocaleDateString();
    return [
      ...bookmarks.map<Item>((b) => ({ key: b.id, kind: 'bookmark', verseId: b.verseId, at: b.updatedAt, text: '', tags: [],
        render: () => <Link to={`/read/${b.verseId.replace('.', '/')}`} className="card note row" style={{ display: 'flex' }}>
          <span style={{ width: 20, color: 'var(--accent)', display: 'inline-flex' }}><Icon name="bookmark" fill /></span>
          <b style={{ fontFamily: 'var(--serif)' }}>Verse {b.verseId}</b><span className="spacer" /><span className="small muted">{date(b.updatedAt)}</span></Link> })),
      ...highlights.map<Item>((h) => ({ key: h.id, kind: 'highlight', verseId: h.verseId, at: h.updatedAt, text: `${h.text} ${h.note ?? ''}`, tags: [],
        render: () => <div className="card note">
          <div className="meta">{ref(h.verseId)}<span className={`swatch ${h.color}`} style={{ width: 12, height: 12 }} />{h.sourceLabel}<span className="spacer" />{date(h.updatedAt)}</div>
          <button style={{ textAlign: 'left', width: '100%' }} onClick={() => setEditHl(h)}>
            <div className="body quote">{h.text}</div>{h.note && <div className="body">{h.note}</div>}
          </button></div> })),
      ...notes.map<Item>((n) => ({ key: n.id, kind: n.kind, verseId: n.verseId, at: n.updatedAt, text: n.body, tags: n.tags,
        render: () => <div className="card note">
          <div className="meta">{ref(n.verseId)}<span className="badge accent">{noteKinds.find((k) => k.k === n.kind)?.label}</span><span className="spacer" />{date(n.updatedAt)}</div>
          <button style={{ textAlign: 'left', width: '100%' }} onClick={() => setEditNote(n)}><div className="body">{n.body}</div></button>
          {n.tags.length > 0 && <div className="meta">{n.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}</div>}</div> })),
      ...anecdotes.map<Item>((a) => ({ key: a.id, kind: 'anecdote', verseId: a.verseId, at: a.updatedAt, text: `${a.title} ${a.body} ${a.source}`, tags: [],
        render: () => <div className="card note">
          <div className="meta">{ref(a.verseId)}<span className="badge">Story</span><span className="spacer" />{date(a.updatedAt)}</div>
          <button style={{ textAlign: 'left', width: '100%' }} onClick={() => setEditAnec(a)}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, marginTop: 6 }}>{a.title}</div><div className="body clamp">{a.body}</div></button></div> })),
      ...journal.map<Item>((j) => ({ key: j.id, kind: 'journal', verseId: [...j.verseIds].sort(compareVerseIds)[0], at: j.updatedAt, text: `${j.title} ${j.body}`, tags: j.tags,
        render: () => <Link to={`/journal/${j.id}`} className="card note" style={{ display: 'block' }}>
          <div className="meta"><span className="badge">Journal</span>{j.date}{j.mood && ` · ${j.mood}`}</div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, marginTop: 6 }}>{j.title || 'Untitled entry'}</div>
          <div className="body clamp" style={{ WebkitLineClamp: 3 }}>{j.body}</div>
          {(j.verseIds.length > 0 || j.tags.length > 0) && <div className="meta">{j.verseIds.map((v) => <span className="verse-ref" key={v}>{v}</span>)}{j.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}</div>}
        </Link> })),
    ];
  }, [bookmarks, highlights, notes, anecdotes, journal]);

  const allTags = useMemo(() => [...new Set(items.flatMap((i) => i.tags))].sort(), [items]);
  const shown = items
    .filter((i) => kind === 'all' || i.kind === kind)
    .filter((i) => !tag || i.tags.includes(tag))
    .filter((i) => !q || `${i.text} ${i.verseId ?? ''} ${i.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'recent' ? b.at - a.at : compareVerseIds(a.verseId, b.verseId) || b.at - a.at));
  const count = (k: Kind) => (k === 'all' ? items.length : items.filter((i) => i.kind === k).length);

  return (
    <>
      <TopBar title="Library" actions={
        <div className="seg" style={{ marginRight: 8 }}>
          <button className={sort === 'recent' ? 'on' : ''} onClick={() => setSort('recent')}>Recent</button>
          <button className={sort === 'verse' ? 'on' : ''} onClick={() => setSort('verse')}>By verse</button>
        </div>} />
      <div className="page">
        <div className="search" style={{ margin: '4px 0 10px' }}><Icon name="search" />
          <input className="field" placeholder="Search everything you've saved" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {filters.filter((f) => f.k === 'all' || count(f.k) > 0 || kind === f.k).map((f) => (
            <button key={f.k} className={'chip' + (kind === f.k ? ' on' : '')} onClick={() => setKind(f.k)}>{f.label} <span style={{ opacity: .6 }}>{count(f.k)}</span></button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="chips" style={{ marginTop: 4 }}>
            {allTags.map((t) => <button key={t} className={'chip' + (tag === t ? ' on' : '')} style={{ minHeight: 30, fontSize: '.8rem' }} onClick={() => setTag(tag === t ? null : t)}>#{t}</button>)}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          {shown.map((i) => <div key={i.key}>{i.render()}</div>)}
        </div>
        {items.length === 0 && (
          <div className="empty">
            <div className="glyph">॥</div>
            <p>Your library collects everything you save while reading: bookmarks, highlights, notes, stories and journal entries.</p>
            <Link className="btn" to="/read">Start reading</Link>
          </div>
        )}
        {items.length > 0 && shown.length === 0 && <div className="empty">Nothing matches.</div>}
      </div>
      <NoteEditor open={!!editNote} note={editNote} onClose={() => setEditNote(undefined)} />
      <HighlightEditor open={!!editHl} hl={editHl} onClose={() => setEditHl(undefined)} />
      {editAnec && <AnecdoteEditor open item={editAnec} verseId={editAnec.verseId} onClose={() => setEditAnec(undefined)} />}
    </>
  );
}
