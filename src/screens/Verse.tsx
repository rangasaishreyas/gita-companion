import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { toast } from '../components/Toast';
import { HighlightText, readSelection, type PendingSelection } from '../components/HighlightText';
import { NoteEditor, HighlightEditor, AnecdoteEditor, colors, noteKinds } from '../components/Editors';
import { loadChapter, loadCommentary, loadIndex } from '../data/loader';
import { useAsync } from '../data/useAsync';
import type { Author } from '../data/types';
import { anecdotesFor } from '../content/anecdotes';
import { presets } from '../styles/themes';
import type { Highlight, Note, ReadStatus, UserAnecdote } from '../db/schema';
import {
  useSettings, setSetting, useVerseStatus, setStatus, autoMarkRead, useIsBookmarked, toggleBookmark,
  useHighlights, saveHighlight, useNotes, useUserAnecdotes, useJournalForVerse,
} from '../db/repo';

type Tab = 'translations' | 'commentary' | 'stories' | 'mine';
const langCode = (l: string) => (l === 'hindi' ? 'hi' : l === 'sanskrit' ? 'sa' : 'en');
const langLabel = (l: string) => (l === 'hindi' ? 'Hindi' : l === 'sanskrit' ? 'Sanskrit' : 'English');

export function VerseScreen() {
  const { c: cs, v: vs } = useParams();
  const c = Number(cs), v = Number(vs), verseId = `${c}.${v}`;
  const nav = useNavigate();
  const settings = useSettings();
  const index = useAsync(loadIndex, []);
  const chapter = useAsync(() => loadChapter(c), [c]);
  const verse = chapter.data?.find((x) => x.n === v);
  const meta = index.data?.chapters.find((x) => x.n === c);
  const status = useVerseStatus(verseId);
  const bookmarked = useIsBookmarked(verseId);
  const highlights = useHighlights(verseId);
  const notes = useNotes(verseId);
  const userAnecdotes = useUserAnecdotes(verseId);
  const journal = useJournalForVerse(verseId);
  const curated = anecdotesFor(verseId);

  const [tab, setTab] = useState<Tab>('translations');
  const [showWM, setShowWM] = useState(settings.showWordMeanings);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [editHl, setEditHl] = useState<Highlight>();
  const [noteSheet, setNoteSheet] = useState<{ open: boolean; note?: Note }>({ open: false });
  const [anecSheet, setAnecSheet] = useState<{ open: boolean; item?: UserAnecdote }>({ open: false });
  const [displaySheet, setDisplaySheet] = useState(false);

  // navigation targets
  const prev = v > 1 ? `/read/${c}/${v - 1}` : c > 1 ? `/read/${c - 1}/${index.data?.chapters[c - 2].verses ?? 1}` : null;
  const next = meta && v < meta.verses ? `/read/${c}/${v + 1}` : c < 18 ? `/read/${c + 1}/1` : null;

  // remember position + auto mark as read after a while on the verse
  useEffect(() => {
    window.scrollTo(0, 0);
    setSetting('lastPosition', verseId);
    if (!settings.autoMarkRead) return;
    const t = window.setTimeout(() => autoMarkRead(verseId), 8000);
    return () => clearTimeout(t);
  }, [verseId, settings.autoMarkRead]);

  // text selection → highlight toolbar
  useEffect(() => {
    let t: number;
    const on = () => { clearTimeout(t); t = window.setTimeout(() => setPending(readSelection()), 200); };
    document.addEventListener('selectionchange', on);
    return () => { document.removeEventListener('selectionchange', on); clearTimeout(t); };
  }, []);

  // swipe left/right between verses
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY, t: Date.now() }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    if (!s || !window.getSelection()?.isCollapsed) return;
    const p = e.changedTouches[0], dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 50 && Date.now() - s.t < 600) {
      if (dx < 0 && next) nav(next, { replace: true }); else if (dx > 0 && prev) nav(prev, { replace: true });
    }
  };

  const translators = index.data?.translators ?? [];
  const lead = verse?.t.find((t) => t.a === settings.defaultTranslator) ?? verse?.t.find((t) => t.a.endsWith('english'));
  const author = (id: string, list: Author[] = translators) => list.find((a) => a.id === id);

  const addHighlight = async (color: (typeof colors)[number], withNote = false) => {
    if (!pending) return;
    const id = await saveHighlight({ verseId, chapter: c, ...pending, color });
    window.getSelection()?.removeAllRanges();
    setPending(null);
    if (withNote) {
      const { db } = await import('../db/schema');
      setEditHl(await db.highlights.get(id));
    } else toast('Highlighted');
  };

  if (chapter.error) return <><TopBar back="/read" title="Verse" /><div className="empty">Couldn't load this chapter. Check your connection and try again.</div></>;
  if (!verse || !meta) return <><TopBar back={`/read/${c}`} title={`Verse ${verseId}`} /><div className="empty">Loading…</div></>;

  const mineCount = notes.length + highlights.length + journal.length;
  return (
    <>
      <TopBar back={`/read/${c}`} title={<Link to={`/read/${c}`}>{`${c}.${v}`} <span className="muted small" style={{ fontFamily: 'var(--sans)', fontWeight: 400 }}>· {meta.translit}</span></Link>}
        actions={<>
          <button className={'iconbtn' + (bookmarked ? ' on' : '')} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'} onClick={async () => { await toggleBookmark(verseId); toast(bookmarked ? 'Bookmark removed' : 'Bookmarked'); }}>
            <Icon name="bookmark" fill={bookmarked} />
          </button>
          <Link className="iconbtn" aria-label="Study together" to="/collab"><Icon name="users" /></Link>
          <button className="iconbtn" aria-label="Reading settings" onClick={() => setDisplaySheet(true)}><Icon name="text" /></button>
        </>} />

      <article className="verse" data-anchor="verse" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <HighlightText className="sa" text={verse.sa} source="sa" sourceLabel="Sanskrit" lang="sa" highlights={highlights} onTapHighlight={setEditHl} />
        {settings.showTranslit && <div className="tr" data-anchor="translit">{verse.tr}</div>}

        {lead && (
          <div className="lead">
            <HighlightText className="" text={lead.t} source={`t:${lead.a}`} sourceLabel={author(lead.a)?.author ?? ''} lang={langCode(author(lead.a)?.lang ?? 'english')} highlights={highlights} onTapHighlight={setEditHl} />
            <span className="by">— {author(lead.a)?.author}</span>
          </div>
        )}

        <StatusBar status={status} onSet={(s) => setStatus(verseId, s).then(() => toast(s === 'read' ? 'Marked as read' : s === 'revisit' ? 'Added to revisit list' : 'Marked unread'))} />

        <button className="disclose" onClick={() => setShowWM(!showWM)}>
          <Icon name={showWM ? 'up' : 'down'} /> Word-by-word meaning
        </button>
        {showWM && <WordMeanings wm={verse.wm} />}

        <div className="tabs" role="tablist" data-anchor="tabs">
          <button className={tab === 'translations' ? 'on' : ''} onClick={() => setTab('translations')}>Translations<span className="count">{verse.t.length}</span></button>
          <button className={tab === 'commentary' ? 'on' : ''} onClick={() => setTab('commentary')}>Commentary</button>
          <button className={tab === 'stories' ? 'on' : ''} onClick={() => setTab('stories')}>Stories{curated.length + userAnecdotes.length > 0 && <span className="count">{curated.length + userAnecdotes.length}</span>}</button>
          <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>My notes{mineCount > 0 && <span className="count">{mineCount}</span>}</button>
        </div>

        <div className="tabpanel">
          {tab === 'translations' && (
            <Translations items={verse.t} translators={translators} pinned={settings.pinnedTranslators} defaultId={settings.defaultTranslator}
              highlights={highlights} onTapHighlight={setEditHl} />
          )}
          {tab === 'commentary' && index.data && (
            <Commentary chapter={c} verse={v} commentators={index.data.commentators} langs={settings.commentaryLangs}
              selected={settings.lastCommentator} highlights={highlights} onTapHighlight={setEditHl} />
          )}
          {tab === 'stories' && (
            <div>
              {curated.map((a, i) => (
                <div className="card note" key={i}>
                  <div className="meta"><span className="badge accent">{a.kind}</span></div>
                  <h3 style={{ fontSize: '1.05rem', margin: '8px 0 2px' }}>{a.title}</h3>
                  <div className="body">{a.body}</div>
                  <div className="meta">Source: {a.source}</div>
                </div>
              ))}
              {userAnecdotes.map((a) => (
                <button className="card note" style={{ display: 'block', width: '100%', textAlign: 'left' }} key={a.id} onClick={() => setAnecSheet({ open: true, item: a })}>
                  <div className="meta"><span className="badge">Yours</span></div>
                  <h3 style={{ fontSize: '1.05rem', margin: '8px 0 2px' }}>{a.title}</h3>
                  <div className="body">{a.body}</div>
                  {a.source && <div className="meta">Source: {a.source}</div>}
                </button>
              ))}
              {curated.length + userAnecdotes.length === 0 && (
                <p className="muted small" style={{ textAlign: 'center' }}>No stories for this verse yet. Is there a story, example or experience it brings to mind?</p>
              )}
              <button className="btn secondary block" onClick={() => setAnecSheet({ open: true })}><Icon name="plus" /> Add a story or anecdote</button>
            </div>
          )}
          {tab === 'mine' && (
            <div>
              <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setNoteSheet({ open: true })}><Icon name="note" /> Add note</button>
                <Link className="btn secondary" style={{ flex: 1 }} to={`/journal/new?verse=${verseId}`}><Icon name="journal" /> Journal</Link>
              </div>
              {notes.sort((a, b) => b.updatedAt - a.updatedAt).map((n) => (
                <button key={n.id} className="card note" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setNoteSheet({ open: true, note: n })}>
                  <div className="meta"><span className="badge accent">{noteKinds.find((k) => k.k === n.kind)?.label}</span>{new Date(n.updatedAt).toLocaleDateString()}</div>
                  <div className="body">{n.body}</div>
                  {n.tags.length > 0 && <div className="meta">{n.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}</div>}
                </button>
              ))}
              {highlights.map((h) => (
                <button key={h.id} className="card note" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setEditHl(h)}>
                  <div className="meta"><span className={`swatch ${h.color}`} style={{ width: 12, height: 12 }} /> Highlight · {h.sourceLabel}</div>
                  <div className="body quote">{h.text}</div>
                  {h.note && <div className="body">{h.note}</div>}
                </button>
              ))}
              {journal.map((j) => (
                <Link key={j.id} to={`/journal/${j.id}`} className="card note" style={{ display: 'block' }}>
                  <div className="meta"><span className="badge">Journal</span>{j.date}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, marginTop: 6 }}>{j.title || 'Untitled entry'}</div>
                  <div className="body clamp" style={{ WebkitLineClamp: 3 }}>{j.body}</div>
                </Link>
              ))}
              {mineCount === 0 && <p className="muted small" style={{ textAlign: 'center' }}>Select any text to highlight it, or add a note with what you noticed, learned or are wondering about.</p>}
            </div>
          )}
        </div>

        <div className="navfoot" data-anchor="navfoot">
          {prev ? <Link replace className="card" to={prev}><div className="k">← Previous</div><div className="v">{prev.split('/').slice(2).join('.')}</div></Link> : <span style={{ flex: 1 }} />}
          {next ? <Link replace className="card" style={{ textAlign: 'right' }} to={next}><div className="k">Next →</div><div className="v">{next.split('/').slice(2).join('.')}</div></Link> : <span style={{ flex: 1 }} />}
        </div>
      </article>

      {pending && (
        <div className="hltoolbar" onMouseDown={(e) => e.preventDefault()}>
          <span className="lbl">Highlight</span>
          {colors.map((col) => (
            <button key={col} aria-label={`Highlight ${col}`} className={`swatch ${col}`}
              onPointerDown={(e) => { e.preventDefault(); addHighlight(col); }} />
          ))}
          <button className="iconbtn" style={{ color: 'var(--bg)', width: 36, height: 36 }} aria-label="Highlight with note"
            onPointerDown={(e) => { e.preventDefault(); addHighlight('saffron', true); }}><Icon name="note" /></button>
        </div>
      )}

      <HighlightEditor open={!!editHl} hl={editHl} onClose={() => setEditHl(undefined)} />
      <NoteEditor open={noteSheet.open} note={noteSheet.note} verseId={verseId} onClose={() => setNoteSheet({ open: false })} />
      <AnecdoteEditor open={anecSheet.open} item={anecSheet.item} verseId={verseId} onClose={() => setAnecSheet({ open: false })} />
      <DisplaySheet open={displaySheet} onClose={() => setDisplaySheet(false)} translators={translators} />
    </>
  );
}

function StatusBar({ status, onSet }: { status: ReadStatus; onSet: (s: ReadStatus) => void }) {
  const opts: Array<{ s: ReadStatus; label: string; icon?: string }> = [
    { s: 'read', label: 'Read', icon: 'check' }, { s: 'revisit', label: 'Revisit', icon: 'refresh' }, { s: 'unread', label: 'Unread' },
  ];
  return (
    <div className="statusbar" role="group" aria-label="Reading status" data-anchor="status">
      {opts.map((o) => (
        <button key={o.s} className={`status ${o.s}` + (status === o.s ? ' on' : '')} aria-pressed={status === o.s} onClick={() => onSet(o.s)}>
          {o.icon && <span style={{ width: 16, height: 16, display: 'inline-flex' }}><Icon name={o.icon} /></span>}{o.label}
        </button>
      ))}
    </div>
  );
}

function WordMeanings({ wm }: { wm: string }) {
  const parts = wm.split(/;\s*/).map((p) => p.split('—'));
  return (
    <div className="card wm" data-anchor="wm" style={{ padding: '12px 16px' }}>
      {parts.map(([w, m], i) => <span key={i}><b>{w}</b>{m ? ` — ${m}` : ''}{i < parts.length - 1 ? '; ' : ''}</span>)}
    </div>
  );
}

function Translations({ items, translators, pinned, defaultId, highlights, onTapHighlight }: {
  items: { a: string; t: string }[]; translators: Author[]; pinned: string[]; defaultId: string; highlights: Highlight[]; onTapHighlight: (h: Highlight) => void;
}) {
  const [lang, setLang] = useState<'all' | 'english' | 'hindi'>('all');
  const sorted = useMemo(() => {
    const rank = (id: string) => (id === defaultId ? -2 : pinned.includes(id) ? -1 : 0);
    return [...items].sort((a, b) => rank(a.a) - rank(b.a));
  }, [items, pinned, defaultId]);
  const shown = sorted.filter((t) => lang === 'all' || translators.find((a) => a.id === t.a)?.lang === lang);
  return (
    <>
      <div className="chips" style={{ marginBottom: 10 }}>
        {(['all', 'english', 'hindi'] as const).map((l) => <button key={l} className={'chip' + (lang === l ? ' on' : '')} onClick={() => setLang(l)}>{l === 'all' ? 'All' : langLabel(l)}</button>)}
      </div>
      {shown.map((t) => {
        const a = translators.find((x) => x.id === t.a);
        return (
          <div className="card tcard" key={t.a}>
            <div className="who"><b>{a?.author}</b><span className="badge">{langLabel(a?.lang ?? '')}</span>
              {t.a === defaultId && <span className="badge accent">Default</span>}
              <span className="spacer" />
              <button className="iconbtn" style={{ width: 32, height: 32 }} aria-label={pinned.includes(t.a) ? 'Unpin' : 'Pin'} onClick={() =>
                setSetting('pinnedTranslators', pinned.includes(t.a) ? pinned.filter((x) => x !== t.a) : [...pinned, t.a])}>
                <span style={{ width: 18, height: 18, display: 'inline-flex', color: pinned.includes(t.a) ? 'var(--accent)' : 'var(--muted)' }}><Icon name="bookmark" fill={pinned.includes(t.a)} /></span>
              </button>
            </div>
            <HighlightText text={t.t} source={`t:${t.a}`} sourceLabel={a?.author ?? ''} lang={langCode(a?.lang ?? 'english')} highlights={highlights} onTapHighlight={onTapHighlight} />
          </div>
        );
      })}
    </>
  );
}

function Commentary({ chapter, verse, commentators, langs, selected, highlights, onTapHighlight }: {
  chapter: number; verse: number; commentators: Author[]; langs: string[]; selected?: string; highlights: Highlight[]; onTapHighlight: (h: Highlight) => void;
}) {
  const data = useAsync(() => loadCommentary(chapter), [chapter]);
  const available = (data.data?.[verse] ?? []).filter((x) => langs.includes(commentators.find((a) => a.id === x.a)?.lang ?? ''));
  const order = (id: string) => ['english', 'hindi', 'sanskrit'].indexOf(commentators.find((a) => a.id === id)?.lang ?? '');
  available.sort((a, b) => order(a.a) - order(b.a));
  const cur = available.find((x) => x.a === selected) ?? available[0];
  if (data.loading && !data.data) return <div className="empty">Loading commentaries…</div>;
  if (data.error) return <div className="empty">Couldn't load commentaries. Check your connection.</div>;
  if (!cur) return <div className="empty">No commentary in your chosen languages for this verse. You can change languages in the reading settings (Aa).</div>;
  const a = commentators.find((x) => x.id === cur.a)!;
  return (
    <>
      <div className="chips" style={{ marginBottom: 12 }}>
        {available.map((x) => {
          const au = commentators.find((y) => y.id === x.a)!;
          return <button key={x.a} className={'chip' + (x.a === cur.a ? ' on' : '')} onClick={() => setSetting('lastCommentator', x.a)}>
            {au.author.replace(/^(Sri|Swami|Shri) /, '').replace(/ \(tr\. [^)]*\)/, '').replace('A.C. Bhaktivedanta Swami ', '')} <span style={{ opacity: .7, fontSize: '.75em' }}>{langLabel(au.lang).slice(0, 2)}</span>
          </button>;
        })}
      </div>
      <div className="card tcard">
        <div className="who"><b>{a.author}</b><span className="badge">{langLabel(a.lang)}</span></div>
        <HighlightText text={cur.t} source={`c:${cur.a}`} sourceLabel={`${a.author} (commentary)`} lang={langCode(a.lang)} highlights={highlights} onTapHighlight={onTapHighlight} />
      </div>
    </>
  );
}

export function DisplaySheet({ open, onClose, translators }: { open: boolean; onClose: () => void; translators: Author[] }) {
  const s = useSettings();
  return (
    <Sheet open={open} onClose={onClose} title="Reading settings">
      <div className="card">
        <div className="setting"><div className="l">Text size</div>
          <div className="seg">{[0.9, 1, 1.15, 1.3].map((f) => <button key={f} className={s.fontScale === f ? 'on' : ''} onClick={() => setSetting('fontScale', f)} style={{ fontSize: `${f * 0.85}rem` }}>A</button>)}</div>
        </div>
        <div className="setting" style={{ flexWrap: 'wrap' }}><div className="l">Theme</div>
          <Link to="/settings/theme" className="btn ghost" style={{ minHeight: 32 }} onClick={onClose}>All colours</Link>
          <div className="theme-swatches">
            <button className={'tsw' + (s.theme === 'system' ? ' on' : '')} onClick={() => setSetting('theme', 'system')} aria-label="Match system" title="Match system"
              style={{ background: 'linear-gradient(135deg, #faf6ee 50%, #15120f 50%)' }} />
            {[...presets, ...s.customThemes].map((p) => (
              <button key={p.id} className={'tsw' + (s.theme === p.id ? ' on' : '')} onClick={() => setSetting('theme', p.id)} aria-label={p.name} title={p.name}
                style={{ background: `linear-gradient(135deg, ${p.tokens.bg} 50%, ${p.tokens.accent} 50%)` }} />
            ))}
          </div>
        </div>
        <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSetting('showTranslit', !s.showTranslit)}>
          <div className="l">Show transliteration</div><span className={'switch' + (s.showTranslit ? ' on' : '')} />
        </button>
        <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSetting('showWordMeanings', !s.showWordMeanings)}>
          <div className="l">Open word meanings by default</div><span className={'switch' + (s.showWordMeanings ? ' on' : '')} />
        </button>
      </div>
      <div className="section-title">Main translation</div>
      <div className="card picker-list" style={{ padding: '0 10px' }}>
        {translators.map((t) => (
          <button key={t.id} className={s.defaultTranslator === t.id ? 'on' : ''} onClick={() => setSetting('defaultTranslator', t.id)}>
            <span style={{ flex: 1 }}>{t.author}</span><span className="badge">{langLabel(t.lang)}</span>
            {s.defaultTranslator === t.id && <span style={{ width: 20, height: 20, display: 'inline-flex' }}><Icon name="check" /></span>}
          </button>
        ))}
      </div>
      <div className="section-title">Commentary languages</div>
      <div className="chips">
        {(['english', 'hindi', 'sanskrit'] as const).map((l) => {
          const on = s.commentaryLangs.includes(l);
          return <button key={l} className={'chip' + (on ? ' on' : '')} onClick={() => setSetting('commentaryLangs', on ? s.commentaryLangs.filter((x) => x !== l) : [...s.commentaryLangs, l])}>{langLabel(l)}</button>;
        })}
      </div>
    </Sheet>
  );
}
