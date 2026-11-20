import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { loadChapter, loadIndex, compareVerseIds } from '../data/loader';
import { useAsync } from '../data/useAsync';
import { useJournal, useNotes, useProgress, useSettings, useHighlights } from '../db/repo';
import { streakDays } from './Progress';

const TOTAL = 701;

function verseOfTheDay(chapters: { n: number; verses: number }[]) {
  const d = new Date();
  let k = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  k = (k * 2654435761) % TOTAL;
  for (const ch of chapters) { if (k < ch.verses) return { c: ch.n, v: k + 1 }; k -= ch.verses; }
  return { c: 2, v: 47 };
}

export function Home() {
  const index = useAsync(loadIndex, []);
  const settings = useSettings();
  const progress = useProgress();
  const journal = useJournal();
  const notes = useNotes();
  const highlights = useHighlights();
  const vod = index.data ? verseOfTheDay(index.data.chapters) : null;
  const vodChapter = useAsync(() => (vod ? loadChapter(vod.c) : Promise.resolve(null)), [vod?.c]);
  const vodVerse = vodChapter.data?.find((x) => x.n === vod?.v);
  const vodText = vodVerse?.t.find((t) => t.a === settings.defaultTranslator) ?? vodVerse?.t.find((t) => t.a.endsWith('english'));

  const read = progress.filter((p) => p.status === 'read').length;
  const revisit = progress.filter((p) => p.status === 'revisit').sort((a, b) => compareVerseIds(a.verseId, b.verseId));
  const last = settings.lastPosition ?? '1.1';
  const [lc, lv] = last.split('.');
  const lastCh = index.data?.chapters.find((c) => c.n === Number(lc));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <TopBar title="" actions={<Link className="iconbtn" to="/settings" aria-label="Settings"><Icon name="settings" /></Link>} />
      <div className="page">
        <div className="hero">
          <div className="om">ॐ</div>
          <h1>{greet}</h1>
          <div className="muted">A few verses, read slowly, go a long way.</div>
        </div>

        <Link to={`/read/${lc}/${lv}`} className="card continue">
          <div className="k">{settings.lastPosition ? 'Continue reading' : 'Begin reading'}</div>
          <div className="v">Verse {last}{lastCh ? ` · ${lastCh.translit}` : ''}</div>
          <div className="small" style={{ opacity: .85, marginTop: 2 }}>{read} of {TOTAL} verses read</div>
          <div className="bar"><i style={{ width: `${(read / TOTAL) * 100}%` }} /></div>
        </Link>

        {vod && vodVerse && (
          <>
            <div className="section-title">Verse of the day</div>
            <Link to={`/read/${vod.c}/${vod.v}`} className="card vod" style={{ display: 'block' }}>
              <div className="small muted" style={{ marginBottom: 6 }}>Bhagavad Gita {vod.c}.{vod.v}</div>
              <div className="sa">{vodVerse.sa.replace(/।।[\d.]+।।/, '॥')}</div>
              {vodText && <div className="en">{vodText.t}</div>}
            </Link>
          </>
        )}

        <div className="section-title">Your practice</div>
        <div className="stats">
          <Link to="/progress" className="card stat"><b>{streakDays(progress)}</b><span>day streak</span></Link>
          <Link to="/library" className="card stat"><b>{notes.length + highlights.length}</b><span>notes & highlights</span></Link>
          <Link to="/journal" className="card stat"><b>{journal.length}</b><span>journal entries</span></Link>
        </div>

        {revisit.length > 0 && (
          <>
            <div className="section-title">To revisit</div>
            <div className="card list">
              {revisit.slice(0, 4).map((r) => (
                <Link key={r.verseId} to={`/read/${r.verseId.replace('.', '/')}`}>
                  <span className="dot revisit" /><span style={{ fontFamily: 'var(--serif)', fontWeight: 600 }}>Verse {r.verseId}</span>
                  <span className="spacer" /><span className="muted small">{new Date(r.updatedAt).toLocaleDateString()}</span>
                </Link>
              ))}
              {revisit.length > 4 && <Link to="/progress"><span className="muted small">See all {revisit.length}</span></Link>}
            </div>
          </>
        )}

        <div className="section-title">Reflect</div>
        <Link to="/journal/new" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
          <span style={{ width: 24, color: 'var(--accent)', display: 'inline-flex' }}><Icon name="journal" /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 600 }}>Write in your journal</div>
            <div className="small muted">{journal[0] ? `Last entry ${journal[0].date}` : 'What stayed with you today?'}</div>
          </div>
          <span style={{ width: 18, color: 'var(--muted)', display: 'inline-flex' }}><Icon name="next" /></span>
        </Link>
      </div>
    </>
  );
}
