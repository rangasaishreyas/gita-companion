import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Ring } from '../components/Ring';
import { loadIndex, compareVerseIds } from '../data/loader';
import { useAsync } from '../data/useAsync';
import { useProgress, setStatus } from '../db/repo';
import type { Progress } from '../db/schema';
import { useStatusMap } from './Read';

const dayKey = (t: number) => new Date(t).toDateString();
export function streakDays(progress: Progress[]) {
  const days = new Set(progress.filter((p) => p.status === 'read').map((p) => dayKey(p.updatedAt)));
  let n = 0; const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1); // today not done yet → count from yesterday
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function ProgressScreen() {
  const index = useAsync(loadIndex, []);
  const progress = useProgress();
  const status = useStatusMap();
  const total = index.data?.chapters.reduce((s, c) => s + c.verses, 0) ?? 701;
  const read = progress.filter((p) => p.status === 'read').length;
  const revisit = progress.filter((p) => p.status === 'revisit').sort((a, b) => compareVerseIds(a.verseId, b.verseId));
  const chaptersDone = index.data?.chapters.filter((c) => [...Array(c.verses)].every((_, i) => status.get(`${c.n}.${i + 1}`) === 'read')).length ?? 0;

  return (
    <>
      <TopBar title="Progress" />
      <div className="page">
        <div className="card ring-wrap">
          <Ring value={read / total} size={96} stroke={8}>
            <b style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem' }}>{Math.round((read / total) * 100)}%</b>
          </Ring>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 600 }}>{read} of {total} verses</div>
            <div className="small muted">{chaptersDone} of 18 chapters complete</div>
            <div className="small muted">{streakDays(progress)}-day reading streak</div>
            <div className="small muted">{revisit.length} marked to revisit</div>
          </div>
        </div>

        {revisit.length > 0 && (
          <>
            <div className="section-title">Revisit queue</div>
            <div className="card list">
              {revisit.map((r) => (
                <div className="item" key={r.verseId}>
                  <span className="dot revisit" />
                  <Link to={`/read/${r.verseId.replace('.', '/')}`} style={{ flex: 1, fontFamily: 'var(--serif)', fontWeight: 600 }}>Verse {r.verseId}</Link>
                  <button className="btn ghost" onClick={() => setStatus(r.verseId, 'read')}>Done</button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-title">All verses</div>
        <div className="legend"><span><i className="dot read" />Read</span><span><i className="dot revisit" />Revisit</span><span><i className="dot" />Unread</span></div>
        {index.data?.chapters.map((ch) => (
          <div key={ch.n} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <Link to={`/read/${ch.n}`} className="row" style={{ marginBottom: 10 }}>
              <b style={{ fontFamily: 'var(--serif)' }}>{ch.n}. {ch.translit}</b><span className="spacer" />
              <span className="small muted">{[...Array(ch.verses)].filter((_, i) => status.get(`${ch.n}.${i + 1}`) === 'read').length}/{ch.verses}</span>
            </Link>
            <div className="grid">
              {[...Array(ch.verses)].map((_, i) => {
                const id = `${ch.n}.${i + 1}`;
                return <Link key={id} to={`/read/${ch.n}/${i + 1}`} className={'cell ' + (status.get(id) ?? '')} aria-label={`Verse ${id}`}>{i + 1}</Link>;
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
