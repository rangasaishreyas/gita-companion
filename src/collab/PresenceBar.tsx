import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCollab, type Participant } from './CollabProvider';
import { Icon } from '../components/Icon';
import { useSettings, setSetting } from '../db/repo';

export function Avatar({ p, size = 32, onClick }: { p: Participant; size?: number; onClick?: () => void }) {
  const initials = p.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <button className={'avatar' + (p.speaking ? ' speaking' : '')} onClick={onClick} title={`${p.name}${p.self ? ' (you)' : ''} · ${p.label}`}
      style={{ width: size, height: size, background: p.color, ['--ring' as string]: p.color }} aria-label={`${p.name}, ${p.label}${p.muted || !p.mic ? ', muted' : ''}`}>
      {initials}
      {(p.muted || !p.mic) && <span className="avatar-mute"><Icon name="micOff" /></span>}
      {p.leader && <span className="avatar-lead"><Icon name="flag" /></span>}
    </button>
  );
}

/** Floating bar shown on every screen while in a session. */
export function PresenceBar() {
  const { status, me, participants, followingId, follow, toggleMute } = useCollab();
  const { showCursors } = useSettings();
  const nav = useNavigate();
  const loc = useLocation();
  if (status === 'idle' || !me) return null;
  const leader = participants.find((p) => p.id === followingId);
  return (
    <div className="presence" role="region" aria-label="Study session">
      <Link to="/collab" className="presence-people" aria-label="Session details">
        {[me, ...participants].slice(0, 6).map((p) => <Avatar key={p.id} p={p} size={30} />)}
        {participants.length === 0 && <span className="small muted" style={{ paddingLeft: 6 }}>{status === 'connecting' ? 'Connecting…' : 'Waiting for others'}</span>}
      </Link>
      {leader ? (
        <button className="presence-follow" onClick={() => follow(null)}>Following {leader.name} <Icon name="close" /></button>
      ) : participants.length > 0 && loc.pathname !== '/collab' ? (
        <span className="presence-where small muted">{participants.filter((p) => p.path === me.path).length ? 'Together here' : participants[0].label}</span>
      ) : null}
      <button className={'presence-btn' + (showCursors ? '' : ' off')} onClick={() => setSetting('showCursors', !showCursors)} aria-label={showCursors ? 'Hide others’ cursors' : 'Show others’ cursors'} aria-pressed={showCursors}>
        <Icon name={showCursors ? 'eye' : 'eyeOff'} />
      </button>
      <button className={'presence-btn' + (me.muted || !me.mic ? ' off' : ' live')} disabled={!me.mic} onClick={toggleMute} aria-label={me.muted ? 'Unmute' : 'Mute'} aria-pressed={!me.muted}>
        <Icon name={me.muted || !me.mic ? 'micOff' : 'mic'} />
      </button>
      {loc.pathname !== '/collab' && <button className="presence-btn" onClick={() => nav('/collab')} aria-label="Open session"><Icon name="users" /></button>}
    </div>
  );
}
