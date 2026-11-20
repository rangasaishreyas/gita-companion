import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../db/repo';
import { toast } from '../components/Toast';
import type { AnchorPos, SelPos } from './anchor';

type Room = ReturnType<typeof import('trystero').joinRoom>;

/** What each participant tells the others about themselves. */
interface PeerState { name: string; color: string; path: string; label: string; muted: boolean; mic: boolean; leader: boolean }
export interface Participant extends PeerState { id: string; speaking: boolean; self?: boolean }
export interface PointerMsg extends AnchorPos { path: string; touch: boolean }
export interface SelMsg extends SelPos { path: string }
export interface LiveEntry { pointer?: PointerMsg & { t: number }; sel?: SelMsg | null }

const APP_ID = 'gita-companion-v1';
const MAX_PEOPLE = 6;
const SPEAK_LEVEL = 0.025;

/** Small pub/sub store for fast-changing pointer data, so the whole app doesn't re-render 20×/second. */
class LiveStore {
  data = new Map<string, LiveEntry>();
  private subs = new Set<() => void>();
  set(id: string, patch: Partial<LiveEntry>) { this.data.set(id, { ...this.data.get(id), ...patch }); this.emit(); }
  remove(id: string) { this.data.delete(id); this.emit(); }
  clear() { this.data.clear(); this.emit(); }
  subscribe(fn: () => void) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private emit() { this.subs.forEach((f) => f()); }
}

/** Shared location: verse pages are shared exactly; private pages (a journal entry) only by section. */
export function describePath(path: string): { path: string; label: string } {
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/read\/(\d+)\/(\d+)/))) return { path, label: `Verse ${m[1]}.${m[2]}` };
  if ((m = path.match(/^\/read\/(\d+)/))) return { path, label: `Chapter ${m[1]}` };
  if (path.startsWith('/read')) return { path: '/read', label: 'Chapters' };
  if (path.startsWith('/journal')) return { path: '/journal', label: 'Journal' };
  if (path.startsWith('/library')) return { path: '/library', label: 'Library' };
  if (path.startsWith('/progress')) return { path: '/progress', label: 'Progress' };
  if (path.startsWith('/settings')) return { path: '/settings', label: 'Settings' };
  if (path.startsWith('/collab')) return { path: '/collab', label: 'Session' };
  return { path: '/', label: 'Home' };
}
const followable = (p: string) => p.startsWith('/read') || p === '/';

interface CollabCtx {
  status: 'idle' | 'connecting' | 'live';
  code: string | null;
  participants: Participant[];
  me: Participant | null;
  waitingLong: boolean;
  followingId: string | null;
  live: LiveStore;
  join: (code: string) => Promise<void>;
  leave: () => void;
  toggleMute: () => void;
  setLeading: (on: boolean) => void;
  follow: (id: string | null) => void;
  sendPointer: (p: PointerMsg | null) => void;
  sendSelection: (s: SelMsg | null) => void;
}
const Ctx = createContext<CollabCtx | null>(null);
export const useCollab = () => useContext(Ctx)!;

export function newSessionCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(r, (b) => abc[b % abc.length]).join('');
}

function relayOverride(): string[] | undefined {
  try { const v = localStorage.getItem('gc-relays'); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
}

export function CollabProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const here = describePath(location.pathname);

  const [status, setStatus] = useState<CollabCtx['status']>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState(false);
  const [mic, setMic] = useState(false);
  const [leading, setLeadingState] = useState(false);
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [waitingLong, setWaitingLong] = useState(false);
  const live = useMemo(() => new LiveStore(), []);

  const roomRef = useRef<Room | null>(null);
  const sendState = useRef<(s: PeerState, target?: string) => void>(() => {});
  const sendPtr = useRef<(p: PointerMsg | null) => void>(() => {});
  const sendSel = useRef<(s: SelMsg | null) => void>(() => {});
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analysers = useRef(new Map<string, AnalyserNode>());
  const audioEls = useRef(new Map<string, HTMLAudioElement>());
  const navByFollow = useRef<string | null>(null);
  const peersRef = useRef(peers); peersRef.current = peers;
  const followRef = useRef(followingId); followRef.current = followingId;

  const myState: PeerState = useMemo(() => ({
    name: settings.collabName || 'Reader', color: settings.collabColor, path: here.path, label: here.label, muted, mic, leader: leading,
  }), [settings.collabName, settings.collabColor, here.path, here.label, muted, mic, leading]);
  const myStateRef = useRef(myState); myStateRef.current = myState;

  // broadcast my state whenever it changes
  useEffect(() => { if (status !== 'idle') sendState.current(myState); }, [myState, status]);

  // ---------- audio level metering (local + remote) ----------
  const meter = useCallback((id: string, stream: MediaStream) => {
    const ctx = audioCtx.current;
    if (!ctx || !stream.getAudioTracks().length) return;
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 512;
    src.connect(an);
    analysers.current.set(id, an);
  }, []);
  useEffect(() => {
    if (status === 'idle') return;
    const buf = new Float32Array(512);
    const held: Record<string, number> = {};
    const t = window.setInterval(() => {
      const now = Date.now(); const next: Record<string, boolean> = {};
      analysers.current.forEach((an, id) => {
        an.getFloatTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        if (Math.sqrt(sum / buf.length) > SPEAK_LEVEL) held[id] = now;
        next[id] = now - (held[id] ?? 0) < 400 && !(id === 'self' && muted);
      });
      setSpeaking((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    }, 150);
    return () => clearInterval(t);
  }, [status, muted]);

  const dropPeer = useCallback((id: string) => {
    setPeers((p) => { const n = { ...p }; delete n[id]; return n; });
    live.remove(id);
    analysers.current.delete(id);
    const el = audioEls.current.get(id); if (el) { el.srcObject = null; el.remove(); audioEls.current.delete(id); }
    if (followRef.current === id) setFollowingId(null);
  }, [live]);

  const leave = useCallback(() => {
    roomRef.current?.leave().catch(() => {});
    roomRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
    audioEls.current.forEach((el) => { el.srcObject = null; el.remove(); }); audioEls.current.clear();
    analysers.current.clear();
    audioCtx.current?.close().catch(() => {}); audioCtx.current = null;
    live.clear();
    setPeers({}); setSpeaking({}); setStatus('idle'); setCode(null); setMic(false); setMuted(false);
    setLeadingState(false); setFollowingId(null); setWaitingLong(false);
    document.body.classList.remove('in-collab');
  }, [live]);

  const join = useCallback(async (raw: string) => {
    const roomCode = raw.trim().toUpperCase();
    if (!roomCode) return;
    if (roomRef.current) leave();
    setStatus('connecting'); setCode(roomCode);
    document.body.classList.add('in-collab');
    audioCtx.current = new AudioContext();
    audioCtx.current.resume().catch(() => {});

    // microphone (optional: if refused, you can still listen)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream; setMic(true); meter('self', stream);
    } catch {
      setMic(false); toast('Microphone unavailable: you can still listen');
    }

    const { joinRoom } = await import('trystero'); // loaded only when a session starts
    const urls = relayOverride();
    const room = joinRoom({ appId: APP_ID, password: `gita:${roomCode}`, maxUsers: MAX_PEOPLE, ...(urls ? { relayConfig: { urls, redundancy: urls.length } } : {}) }, `room-${roomCode}`);
    roomRef.current = room;

    const state = room.makeAction<PeerState>('state');
    const ptr = room.makeAction<PointerMsg | null>('ptr');
    const sel = room.makeAction<SelMsg | null>('sel');
    sendState.current = (s, target) => { state.send(s, target ? { target } : undefined).catch(() => {}); };
    sendPtr.current = (p) => { ptr.send(p).catch(() => {}); };
    sendSel.current = (s) => { sel.send(s).catch(() => {}); };

    state.onMessage((s, { peerId }) => {
      const prev = peersRef.current[peerId];
      setPeers((p) => ({ ...p, [peerId]: s }));
      if (!prev) toast(`${s.name} joined`);
      if (s.leader && !prev?.leader) {
        setLeadingState(false);
        setFollowingId(peerId);
        toast(`${s.name} is leading. Following along`);
      }
      if (!s.leader && prev?.leader && followRef.current === peerId) setFollowingId(null);
    });
    ptr.onMessage((p, { peerId }) => live.set(peerId, { pointer: p ? { ...p, t: Date.now() } : undefined }));
    sel.onMessage((s, { peerId }) => live.set(peerId, { sel: s }));

    room.onPeerJoin(({ peerId }) => {
      sendState.current(myStateRef.current, peerId);
      if (streamRef.current) room.addStream(streamRef.current, { target: peerId }).catch(() => {});
    }, { replay: true });
    room.onPeerLeave(({ peerId }) => {
      const p = peersRef.current[peerId];
      if (p) toast(`${p.name} left`);
      dropPeer(peerId);
    });
    room.onPeerStream((stream, { peerId }) => {
      let el = audioEls.current.get(peerId);
      if (!el) { el = document.createElement('audio'); el.autoplay = true; el.setAttribute('playsinline', ''); el.dataset.peer = peerId; document.body.appendChild(el); audioEls.current.set(peerId, el); }
      el.srcObject = stream; el.play().catch(() => {});
      meter(peerId, stream);
    }, { replay: true });
    room.onError((e) => console.warn('collab:', e.message));

    setStatus('live');
    setWaitingLong(false);
    window.setTimeout(() => { if (roomRef.current === room && Object.keys(peersRef.current).length === 0) setWaitingLong(true); }, 20000);
  }, [leave, live, meter, dropPeer]);

  useEffect(() => () => { roomRef.current?.leave().catch(() => {}); }, []);
  useEffect(() => { if (Object.keys(peers).length) setWaitingLong(false); }, [peers]);

  // ---------- follow the leader ----------
  const followedPath = followingId ? peers[followingId]?.path : undefined;
  useEffect(() => {
    if (!followedPath || !followable(followedPath) || followedPath === location.pathname) return;
    navByFollow.current = followedPath;
    navigate(followedPath);
  }, [followedPath]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // navigating yourself while following stops following
    if (!followRef.current) return;
    if (location.pathname === navByFollow.current) return;
    const fp = peersRef.current[followRef.current]?.path;
    if (fp && fp !== location.pathname && followable(location.pathname) && !location.pathname.startsWith('/collab')) {
      setFollowingId(null); toast('Stopped following');
    }
  }, [location.pathname]);

  const toggleMute = useCallback(() => {
    setMuted((m) => { streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = m)); return !m; });
  }, []);
  const setLeading = useCallback((on: boolean) => { setLeadingState(on); if (on) setFollowingId(null); }, []);
  const follow = useCallback((id: string | null) => {
    setFollowingId(id);
    if (id) { const p = peersRef.current[id]; if (p && followable(p.path)) { navByFollow.current = p.path; navigate(p.path); } }
  }, [navigate]);

  // pointer messages: throttle to ~20/s with a trailing send
  const lastPtr = useRef(0); const pendingPtr = useRef<PointerMsg | null | undefined>(undefined); const ptrTimer = useRef<number>();
  const sendPointer = useCallback((p: PointerMsg | null) => {
    if (!roomRef.current) return;
    const now = Date.now();
    pendingPtr.current = p;
    if (now - lastPtr.current >= 50) { lastPtr.current = now; sendPtr.current(p); pendingPtr.current = undefined; return; }
    clearTimeout(ptrTimer.current);
    ptrTimer.current = window.setTimeout(() => {
      if (pendingPtr.current !== undefined) { lastPtr.current = Date.now(); sendPtr.current(pendingPtr.current); pendingPtr.current = undefined; }
    }, 50);
  }, []);
  const lastSel = useRef('');
  const sendSelection = useCallback((s: SelMsg | null) => {
    if (!roomRef.current) return;
    const k = JSON.stringify(s); if (k === lastSel.current) return;
    lastSel.current = k; sendSel.current(s);
  }, []);

  const participants: Participant[] = useMemo(
    () => Object.entries(peers).map(([id, s]) => ({ ...s, id, speaking: !!speaking[id] })),
    [peers, speaking],
  );
  const me: Participant | null = status === 'idle' ? null : { ...myState, id: 'self', speaking: !!speaking.self, self: true };

  const value: CollabCtx = {
    status, code, participants, me, waitingLong, followingId, live,
    join, leave, toggleMute, setLeading, follow, sendPointer, sendSelection,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
