import { useEffect, useRef, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';
import { useSettings, setSetting, uid } from '../db/repo';
import { presets, tokenGroups, applyTheme, resolveTheme, contrast, bestOn, themePreview, type ThemeDef, type ThemeTokens } from '../styles/themes';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function Preview({ t, name, selected, sub, onClick }: { t: ThemeTokens; name: string; selected?: boolean; sub?: string; onClick: () => void }) {
  return (
    <button className={'theme-card' + (selected ? ' on' : '')} onClick={onClick} aria-pressed={selected} style={{ background: t.bg, color: t.text, borderColor: selected ? t.accent : t.line }}>
      <div className="tc-surface" style={{ background: t.surface, borderColor: t.line }}>
        <div style={{ fontFamily: 'var(--deva)', color: t.accent, fontSize: 13, lineHeight: 1.2 }}>कर्मण्येव</div>
        <div style={{ fontSize: 11, lineHeight: 1.35 }}>Your right is <span style={{ background: t.hlSaffron }}>to act</span></div>
        <div style={{ fontSize: 10, color: t.muted }}>Swami Sivananda</div>
      </div>
      <div className="row" style={{ gap: 4, marginTop: 8 }}>
        <span className="tc-pill" style={{ background: t.accent, color: t.accentText }}>Read</span>
        <span className="tc-dot" style={{ background: t.ok }} /><span className="tc-dot" style={{ background: t.revisit }} />
        <span className="tc-dot" style={{ background: t.hlGreen }} /><span className="tc-dot" style={{ background: t.hlBlue }} />
      </div>
      <div className="tc-name">{name}{sub && <small style={{ color: t.muted }}>{sub}</small>}</div>
      {selected && <span className="tc-check" style={{ background: t.accent, color: t.accentText }}><Icon name="check" /></span>}
    </button>
  );
}

export function ThemeSettings() {
  const s = useSettings();
  const followSystem = s.theme === 'system';
  const current = resolveTheme(s.theme, s.customThemes, s.systemLight, s.systemDark, prefersDark());
  const [editing, setEditing] = useState<ThemeDef | null>(null);
  const [isNew, setIsNew] = useState(false);

  // live-preview while editing; restore saved theme when done
  useEffect(() => {
    if (!editing) return;
    themePreview.active = true;
    applyTheme(editing.tokens);
  }, [editing]);
  const latest = useRef(s); latest.current = s;
  const stopPreview = () => {
    const l = latest.current;
    themePreview.active = false;
    applyTheme(resolveTheme(l.theme, l.customThemes, l.systemLight, l.systemDark, prefersDark()).tokens);
  };
  useEffect(() => () => { if (themePreview.active) stopPreview(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (d: ThemeDef) => {
    if (!followSystem) return setSetting('theme', d.id);
    setSetting(d.tokens.dark ? 'systemDark' : 'systemLight', d.id);
  };
  const isSelected = (d: ThemeDef) => (followSystem ? s.systemLight === d.id || s.systemDark === d.id : s.theme === d.id);

  const startEdit = (base: ThemeDef, asNew: boolean) => {
    setIsNew(asNew);
    setEditing(asNew ? { id: uid(), name: `My ${base.name}`, tokens: { ...base.tokens } } : { ...base, tokens: { ...base.tokens } });
    window.scrollTo(0, 0);
  };
  const saveEdit = async () => {
    if (!editing) return;
    const list = s.customThemes.filter((c) => c.id !== editing.id);
    await setSetting('customThemes', [...list, editing]);
    if (followSystem) await setSetting(editing.tokens.dark ? 'systemDark' : 'systemLight', editing.id);
    else await setSetting('theme', editing.id);
    themePreview.active = false;
    setEditing(null); toast('Theme saved');
  };
  const cancelEdit = () => { setEditing(null); stopPreview(); };
  const removeCustom = async (d: ThemeDef) => {
    if (!confirm(`Delete “${d.name}”?`)) return;
    await setSetting('customThemes', s.customThemes.filter((c) => c.id !== d.id));
    if (s.theme === d.id) await setSetting('theme', d.tokens.dark ? 'night' : 'saffron');
    if (s.systemLight === d.id) await setSetting('systemLight', 'saffron');
    if (s.systemDark === d.id) await setSetting('systemDark', 'night');
  };

  if (editing) {
    const t = editing.tokens;
    const set = (k: keyof ThemeTokens, v: string | boolean) => setEditing({ ...editing, tokens: { ...t, [k]: v } });
    const checks = [
      { label: 'Main text on page', a: t.text, b: t.bg, fix: () => set('text', bestOn(t.bg)) },
      { label: 'Main text on cards', a: t.text, b: t.surface, fix: () => set('text', bestOn(t.surface)) },
      { label: 'Secondary text on page', a: t.muted, b: t.bg, fix: () => set('muted', bestOn(t.bg) === '#ffffff' ? '#c8c8c8' : '#555555') },
      { label: 'Text on accent buttons', a: t.accentText, b: t.accent, fix: () => set('accentText', bestOn(t.accent)) },
    ].map((c) => ({ ...c, ratio: contrast(c.a, c.b) }));
    return (
      <>
        <TopBar title={isNew ? 'New theme' : 'Edit theme'} actions={<button className="btn ghost" onClick={cancelEdit}>Cancel</button>} />
        <div className="page">
          <p className="small muted" style={{ margin: '4px 4px 12px' }}>Changes preview live across the whole app.</p>
          <input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Theme name" />
          <div className="card" style={{ marginTop: 12 }}>
            <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => set('dark', !t.dark)}>
              <div className="l">Dark theme<small>Used for the “Match system” dark slot and browser controls</small></div>
              <span className={'switch' + (t.dark ? ' on' : '')} />
            </button>
          </div>
          {tokenGroups.map((g) => (
            <div key={g.label}>
              <div className="section-title">{g.label}</div>
              <div className="card">
                {g.keys.map(({ k, label }) => (
                  <label className="setting" key={k}>
                    <div className="l">{label}<small>{t[k].toUpperCase()}</small></div>
                    <input type="color" className="colorpick" value={t[k]} onChange={(e) => set(k, e.target.value)} aria-label={label} />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="section-title">Readability</div>
          <div className="card">
            {checks.map((c) => (
              <div className="setting" key={c.label}>
                <div className="l">{c.label}<small>{c.ratio.toFixed(1)} : 1 {c.ratio >= 4.5 ? '· good' : '· hard to read (aim for 4.5)'}</small></div>
                {c.ratio >= 4.5 ? <span style={{ width: 22, color: 'var(--ok)', display: 'inline-flex' }}><Icon name="check" /></span>
                  : <button className="btn secondary" style={{ minHeight: 34 }} onClick={c.fix}>Fix</button>}
              </div>
            ))}
          </div>
          <div className="row" style={{ margin: '20px 0' }}>
            <button className="btn secondary" style={{ flex: 1 }} onClick={cancelEdit}>Cancel</button>
            <button className="btn" style={{ flex: 1 }} onClick={saveEdit}>Save theme</button>
          </div>
        </div>
      </>
    );
  }

  const light = presets.filter((p) => !p.tokens.dark), dark = presets.filter((p) => p.tokens.dark);
  return (
    <>
      <TopBar back="/settings" title="Theme & colours" />
      <div className="page">
        <div className="card" style={{ marginTop: 4 }}>
          <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSetting('theme', followSystem ? current.id : 'system')}>
            <div className="l">Match system light/dark<small>{followSystem ? 'Pick one light and one dark theme below' : 'Using one theme all the time'}</small></div>
            <span className={'switch' + (followSystem ? ' on' : '')} />
          </button>
        </div>
        <div className="section-title">Light</div>
        <div className="theme-grid">{light.map((p) => <Preview key={p.id} t={p.tokens} name={p.name} selected={isSelected(p)} onClick={() => pick(p)} />)}</div>
        <div className="section-title">Dark</div>
        <div className="theme-grid">{dark.map((p) => <Preview key={p.id} t={p.tokens} name={p.name} selected={isSelected(p)} onClick={() => pick(p)} />)}</div>

        <div className="section-title">Your themes</div>
        {s.customThemes.length > 0 && (
          <div className="theme-grid">
            {s.customThemes.map((c) => (
              <div key={c.id} style={{ position: 'relative' }}>
                <Preview t={c.tokens} name={c.name} sub={c.tokens.dark ? 'Dark' : 'Light'} selected={isSelected(c)} onClick={() => pick(c)} />
                <div className="row" style={{ gap: 4, justifyContent: 'center', marginTop: 4 }}>
                  <button className="btn ghost" style={{ minHeight: 32 }} onClick={() => startEdit(c, false)}>Edit</button>
                  <button className="btn danger" style={{ minHeight: 32 }} onClick={() => removeCustom(c)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => startEdit(current, true)}>
          <Icon name="edit" /> Customise colours (start from {current.name})
        </button>
        <p className="small muted" style={{ textAlign: 'center' }}>Every colour can be changed: page, cards, text, accent, status and highlight colours.</p>
      </div>
    </>
  );
}
