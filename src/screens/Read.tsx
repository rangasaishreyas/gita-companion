import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Ring } from '../components/Ring';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';
import { loadChapter, loadIndex } from '../data/loader';
import { useAsync } from '../data/useAsync';
import { useProgress, setChapterStatus, useSettings } from '../db/repo';

export function useStatusMap() {
  const progress = useProgress();
  return useMemo(() => new Map(progress.map((p) => [p.verseId, p.status])), [progress]);
}

export function ChapterList() {
  const index = useAsync(loadIndex, []);
  const status = useStatusMap();
  return (
    <>
      <TopBar title="Bhagavad Gita" />
      <div className="page">
        <p className="muted small" style={{ margin: '4px 4px 12px' }}>18 chapters · 701 verses</p>
        <div className="card">
          {index.data?.chapters.map((ch) => {
            let read = 0, revisit = 0;
            for (let v = 1; v <= ch.verses; v++) { const s = status.get(`${ch.n}.${v}`); if (s === 'read') read++; else if (s === 'revisit') revisit++; }
            return (
              <Link to={`/read/${ch.n}`} className="ch-item" key={ch.n}>
                <Ring value={read / ch.verses}><span style={{ fontFamily: 'var(--serif)', fontWeight: 600 }}>{ch.n}</span></Ring>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{ch.translit}</div>
                  <div className="s">{ch.meaning} · {ch.verses} verses{revisit ? ` · ${revisit} to revisit` : ''}</div>
                </div>
                <span style={{ width: 18, color: 'var(--muted)', display: 'inline-flex' }}><Icon name="next" /></span>
              </Link>
            );
          })}
          {index.loading && <div className="empty">Loading…</div>}
        </div>
        <p className="muted small" style={{ textAlign: 'center', margin: '18px 0' }}>Text, translations and commentaries from the public-domain gita/gita dataset.</p>
      </div>
    </>
  );
}

export function ChapterScreen() {
  const c = Number(useParams().c);
  const index = useAsync(loadIndex, []);
  const verses = useAsync(() => loadChapter(c), [c]);
  const settings = useSettings();
  const status = useStatusMap();
  const [more, setMore] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [menu, setMenu] = useState(false);
  const ch = index.data?.chapters.find((x) => x.n === c);
  const read = verses.data?.filter((v) => status.get(v.id) === 'read').length ?? 0;
  const firstUnread = verses.data?.find((v) => status.get(v.id) !== 'read');

  return (
    <>
      <TopBar back="/read" title={ch ? `Chapter ${c}` : ''} actions={<button className="iconbtn" aria-label="Chapter actions" onClick={() => setMenu(true)}><Icon name="more" fill /></button>} />
      <div className="page">
        {ch && (
          <div className="ch-head">
            <div className="sa">{ch.name}</div>
            <h1>{ch.translit}</h1>
            <div className="muted">{ch.meaning}</div>
            <div className="card" style={{ padding: 16, marginTop: 14 }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <span className="small muted">Chapter summary</span><span className="spacer" />
                <div className="seg"><button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button><button className={lang === 'hi' ? 'on' : ''} onClick={() => setLang('hi')}>हि</button></div>
              </div>
              <div className={'summary' + (more ? '' : ' clamp')} lang={lang} style={lang === 'hi' ? { fontFamily: 'var(--deva)' } : undefined}>{lang === 'en' ? ch.summary : ch.summaryHi}</div>
              <button className="btn ghost" style={{ paddingLeft: 0 }} onClick={() => setMore(!more)}>{more ? 'Show less' : 'Read more'}</button>
            </div>
            <div className="row" style={{ margin: '14px 0' }}>
              <Ring value={read / ch.verses} size={36} stroke={3} />
              <span className="small muted">{read} of {ch.verses} read</span>
              <span className="spacer" />
              {firstUnread && <Link className="btn" to={`/read/${c}/${firstUnread.n}`}>{read ? 'Continue' : 'Begin'}</Link>}
            </div>
          </div>
        )}
        <div className="card">
          {verses.data?.map((v) => {
            const lead = v.t.find((t) => t.a === settings.defaultTranslator) ?? v.t[0];
            const s = status.get(v.id);
            return (
              <Link to={`/read/${c}/${v.n}`} className="vrow" key={v.n}>
                <span className={'dot ' + (s ?? '')} title={s ?? 'unread'} />
                <span className="n">{v.id}</span>
                <span className="p" lang={lead?.a.endsWith('hindi') ? 'hi' : 'en'}>{lead?.t}</span>
              </Link>
            );
          })}
          {verses.loading && <div className="empty">Loading verses…</div>}
        </div>
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} title={`Chapter ${c}`}>
        <div className="stack">
          <button className="btn block" onClick={async () => { await setChapterStatus(c, ch!.verses, 'read'); setMenu(false); toast('Chapter marked as read'); }}>Mark whole chapter read</button>
          <button className="btn secondary block" onClick={async () => { await setChapterStatus(c, ch!.verses, 'revisit'); setMenu(false); toast('Chapter added to revisit'); }}>Mark whole chapter to revisit</button>
          <button className="btn secondary block" onClick={async () => { await setChapterStatus(c, ch!.verses, 'unread'); setMenu(false); toast('Chapter marked unread'); }}>Mark whole chapter unread</button>
        </div>
      </Sheet>
    </>
  );
}
