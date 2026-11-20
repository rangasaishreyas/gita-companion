import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { toast } from '../components/Toast';
import { useCollab, newSessionCode } from '../collab/CollabProvider';
import { Avatar } from '../collab/PresenceBar';
import { useSettings, setSetting } from '../db/repo';

const palette = ['#e4572e', '#d1495b', '#c2457a', '#8e5bd1', '#3d7dd8', '#1b998b', '#4c9a2a', '#d9a21b'];

export function CollabScreen() {
  const { code: linkCode } = useParams();
  const nav = useNavigate();
  const c = useCollab();
  const s = useSettings();
  const [name, setName] = useState(s.collabName);
  const [joinCode, setJoinCode] = useState(linkCode?.toUpperCase() ?? '');
  useEffect(() => { if (s.collabName && !name) setName(s.collabName); }, [s.collabName]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureName = async () => {
    const n = name.trim();
    if (!n) { toast('Add your name first'); return false; }
    if (n !== s.collabName) await setSetting('collabName', n);
    return true;
  };
  const start = async () => { if (await ensureName()) { const code = newSessionCode(); await c.join(code); nav('/collab', { replace: true }); } };
  const joinIt = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { toast('Enter the session code'); return; }
    if (await ensureName()) { await c.join(code); nav('/collab', { replace: true }); }
  };
  const link = c.code ? `${location.origin}${location.pathname}#/collab/${c.code}` : '';
  const share = async () => {
    const data = { title: 'Read the Gita with me', text: `Join my Gita study session (code ${c.code})`, url: link };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(link); toast('Link copied'); }
    } catch { /* user cancelled */ }
  };

  if (c.status !== 'idle' && c.me) {
    const everyone = [c.me, ...c.participants];
    return (
      <>
        <TopBar title="Study together" />
        <div className="page">
          <div className="card session-code">
            <div className="small muted">Session code</div>
            <div className="code" aria-live="polite">{c.code}</div>
            <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
              <button className="btn" onClick={share}><Icon name="share" /> Invite</button>
              <button className="btn secondary" onClick={async () => { await navigator.clipboard.writeText(link).catch(() => {}); toast('Link copied'); }}>Copy link</button>
            </div>
            {c.waitingLong && c.participants.length === 0 && (
              <p className="small muted" style={{ marginBottom: 0 }}>Nobody has connected yet. Share the code, and make sure everyone has the same one. On some strict mobile or office networks peer-to-peer calls can't connect; trying Wi-Fi usually helps.</p>
            )}
          </div>

          <div className="section-title">In this session · {everyone.length}/6</div>
          <div className="card list">
            {everyone.map((p) => (
              <div className="item" key={p.id}>
                <Avatar p={p} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}{p.self && <span className="muted small"> (you)</span>}{p.leader && <span className="badge accent" style={{ marginLeft: 6 }}>Leading</span>}</div>
                  <div className="small muted">{p.label}{!p.mic ? ' · listening only' : p.muted ? ' · muted' : p.speaking ? ' · speaking' : ''}</div>
                </div>
                {!p.self && (
                  c.followingId === p.id
                    ? <button className="btn secondary" style={{ minHeight: 36 }} onClick={() => c.follow(null)}>Unfollow</button>
                    : <button className="btn ghost" style={{ minHeight: 36 }} onClick={() => c.follow(p.id)}>Follow</button>
                )}
              </div>
            ))}
          </div>

          <div className="section-title">Controls</div>
          <div className="card">
            <button className="setting" style={{ width: '100%', textAlign: 'left' }} disabled={!c.me.mic} onClick={c.toggleMute}>
              <div className="l">{!c.me.mic ? 'Microphone unavailable' : c.me.muted ? 'You are muted' : 'Your microphone is on'}<small>{c.me.mic ? 'Tap to ' + (c.me.muted ? 'unmute' : 'mute') : 'Allow microphone access in your browser and rejoin to talk'}</small></div>
              <span className={'switch' + (c.me.mic && !c.me.muted ? ' on' : '')} />
            </button>
            <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => c.setLeading(!c.me!.leader)}>
              <div className="l">Lead the group<small>Everyone follows the verses you open. They can stop following any time.</small></div>
              <span className={'switch' + (c.me.leader ? ' on' : '')} />
            </button>
            <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSetting('showCursors', !s.showCursors)}>
              <div className="l">Show others' cursors<small>Pointers, touches and text selections of people on the same page</small></div>
              <span className={'switch' + (s.showCursors ? ' on' : '')} />
            </button>
            <button className="setting" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSetting('shareCursor', !s.shareCursor)}>
              <div className="l">Share my pointer<small>Let others see where you point and what you select</small></div>
              <span className={'switch' + (s.shareCursor ? ' on' : '')} />
            </button>
          </div>
          <div className="row" style={{ margin: '16px 0', gap: 8 }}>
            <Link className="btn secondary" style={{ flex: 1 }} to="/read">Open the Gita</Link>
            <button className="btn danger" style={{ flex: 1, border: '1px solid var(--line)' }} onClick={() => { c.leave(); toast('You left the session'); }}><Icon name="logout" /> Leave</button>
          </div>
          <p className="small muted" style={{ textAlign: 'center' }}>Voice goes directly between devices, encrypted, and is never recorded. Up to 6 people.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar back="/" title="Study together" />
      <div className="page">
        <div className="hero" style={{ paddingTop: 8 }}>
          <div className="om" style={{ fontSize: '1.3rem' }}>सत्सङ्ग</div>
          <h1 style={{ fontSize: '1.4rem' }}>Read the Gita with friends</h1>
          <p className="muted" style={{ marginTop: 6 }}>Talk over voice, move through verses together, and see where everyone is pointing. No account needed: share a code.</p>
        </div>
        <div className="section-title">You</div>
        <div className="card" style={{ padding: 16 }}>
          <input className="field" placeholder="Your name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && setSetting('collabName', name.trim())} />
          <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {palette.map((col) => (
              <button key={col} className={'swatch' + (s.collabColor === col ? ' on' : '')} style={{ background: col, borderColor: s.collabColor === col ? 'var(--text)' : 'transparent' }}
                onClick={() => setSetting('collabColor', col)} aria-label={`Colour ${col}`} />
            ))}
          </div>
        </div>

        {linkCode && (
          <button className="btn block" style={{ marginTop: 16 }} onClick={joinIt}><Icon name="users" /> Join session {joinCode}</button>
        )}

        <div className="section-title">Start</div>
        <button className="btn block" onClick={start}><Icon name="plus" /> Start a new session</button>

        <div className="section-title">Or join with a code</div>
        <div className="row">
          <input className="field" style={{ textTransform: 'uppercase', letterSpacing: '.2em', fontWeight: 600 }} placeholder="ABC123" maxLength={8}
            value={joinCode} onChange={(e) => setJoinCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && joinIt()} />
          <button className="btn secondary" onClick={joinIt}>Join</button>
        </div>
        <p className="small muted" style={{ marginTop: 16 }}>Your browser will ask for the microphone; if you say no you can still listen. Works best on Wi-Fi with up to 6 people.</p>
      </div>
    </>
  );
}
