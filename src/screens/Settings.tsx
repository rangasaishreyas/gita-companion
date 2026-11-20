import { useRef, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';
import { DisplaySheet } from './Verse';
import { useSettings, setSetting } from '../db/repo';
import { exportAll, downloadJson, importAll, clearAll } from '../db/backup';
import { downloadAll, loadIndex } from '../data/loader';
import { useAsync } from '../data/useAsync';

export function SettingsScreen() {
  const s = useSettings();
  const index = useAsync(loadIndex, []);
  const [display, setDisplay] = useState(false);
  const [dl, setDl] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  return (
    <>
      <TopBar back="/" title="Settings" />
      <div className="page">
        <div className="section-title">Reading</div>
        <div className="card">
          <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setDisplay(true)}>
            <div className="l">Text, theme & translations<small>Size, theme, transliteration, main translation, commentary languages</small></div>
            <span style={{ width: 18, color: 'var(--muted)', display: 'inline-flex' }}><Icon name="next" /></span>
          </button>
          <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSetting('autoMarkRead', !s.autoMarkRead)}>
            <div className="l">Mark verses read automatically<small>After about 8 seconds on a verse. It never overrides "Revisit" or "Unread" that you set yourself.</small></div>
            <span className={'switch' + (s.autoMarkRead ? ' on' : '')} />
          </button>
        </div>

        <div className="section-title">Offline</div>
        <div className="card">
          <button className="setting" style={{ width: '100%', textAlign: 'left' }} disabled={!!dl && dl !== 'done'} onClick={async () => {
            try { await downloadAll((d, t) => setDl(`${Math.round((d / t) * 100)}%`)); setDl('done'); toast('Everything is available offline'); }
            catch { setDl(null); toast('Download failed, check your connection'); }
          }}>
            <div className="l">Download everything for offline<small>{dl === 'done' ? 'All chapters and commentaries saved on this device' : dl ? `Downloading… ${dl}` : 'About 27 MB: all verses, translations and commentaries'}</small></div>
            <span style={{ width: 22, color: 'var(--accent)', display: 'inline-flex' }}><Icon name={dl === 'done' ? 'check' : 'download'} /></span>
          </button>
        </div>

        <div className="section-title">Your data</div>
        <div className="card">
          <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={async () => {
            downloadJson(await exportAll(), `gita-companion-backup-${new Date().toISOString().slice(0, 10)}.json`); toast('Backup downloaded');
          }}>
            <div className="l">Export backup<small>Progress, bookmarks, highlights, notes, stories and journal as a JSON file</small></div>
            <span style={{ width: 22, color: 'var(--accent)', display: 'inline-flex' }}><Icon name="download" /></span>
          </button>
          <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => file.current?.click()}>
            <div className="l">Import backup<small>Merges with what's here. Newer edits win, so nothing is duplicated.</small></div>
            <span style={{ width: 22, color: 'var(--accent)', display: 'inline-flex' }}><Icon name="upload" /></span>
          </button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            try { const n = await importAll(JSON.parse(await f.text())); toast(`Imported ${n} items`); }
            catch (err) { toast((err as Error).message || 'Import failed'); }
          }} />
          <button className="setting" style={{ width: '100%', textAlign: 'left', color: 'var(--danger)' }} onClick={async () => {
            if (confirm('Erase all your progress, notes, highlights and journal on this device? Export a backup first if you want to keep them.')) { await clearAll(); toast('All data erased'); }
          }}>
            <div className="l">Erase all data on this device</div>
            <span style={{ width: 22, display: 'inline-flex' }}><Icon name="trash" /></span>
          </button>
        </div>
        <p className="small muted" style={{ margin: '10px 4px' }}>Everything you write stays on this device; there is no account and nothing is sent anywhere. Export a backup regularly, or use it to move to another device.</p>

        <div className="section-title">About</div>
        <div className="card" style={{ padding: 16 }}>
          <p className="small" style={{ marginTop: 0 }}>Sanskrit text, transliteration, word meanings, translations and commentaries come from the <b>gita/gita</b> open dataset (public domain, Unlicense). Stories marked “Story”, “Context”, “History” or “Reflection” are short retellings written for this app, with their sources noted.</p>
          <p className="small muted" style={{ marginBottom: 0 }}>{index.data ? `${index.data.translators.length} translators · ${index.data.commentators.length} commentators` : ''}</p>
        </div>
      </div>
      <DisplaySheet open={display} onClose={() => setDisplay(false)} translators={index.data?.translators ?? []} />
    </>
  );
}
