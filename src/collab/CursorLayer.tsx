import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useCollab, describePath } from './CollabProvider';
import { anchorAt, currentSelection, resolveAnchor, selectionRects } from './anchor';
import { useSettings } from '../db/repo';

interface Drawn { id: string; name: string; color: string; x?: number; y?: number; touch?: boolean; fading?: boolean; rects: Array<{ l: number; t: number; w: number; h: number }> }

/** Sends my pointer/selection and draws everyone else's on top of the page. */
export function CursorLayer() {
  const { status, participants, live, sendPointer, sendSelection } = useCollab();
  const { showCursors, shareCursor } = useSettings();
  const loc = useLocation();
  const myPath = describePath(loc.pathname).path;
  const [drawn, setDrawn] = useState<Drawn[]>([]);
  const on = status === 'live';

  // ---- outgoing ----
  useEffect(() => {
    if (!on || !shareCursor) { if (on) { sendPointer(null); sendSelection(null); } return; }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && e.type === 'pointermove' && e.buttons === 0) return;
      const a = anchorAt(e.target, e.clientX, e.clientY);
      sendPointer({ ...a, path: myPath, touch: e.pointerType !== 'mouse' });
    };
    const out = (e: MouseEvent) => { if (!e.relatedTarget) sendPointer(null); };
    let selT: number;
    const selChange = () => {
      clearTimeout(selT);
      selT = window.setTimeout(() => { const s = currentSelection(); sendSelection(s ? { ...s, path: myPath } : null); }, 120);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    document.addEventListener('mouseout', out);
    document.addEventListener('selectionchange', selChange);
    return () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move);
      document.removeEventListener('mouseout', out); document.removeEventListener('selectionchange', selChange); clearTimeout(selT);
    };
  }, [on, shareCursor, myPath, sendPointer, sendSelection]);

  // ---- incoming: redraw every frame while someone is visible (handles scrolling & layout) ----
  useEffect(() => {
    if (!on || !showCursors) { setDrawn([]); return; }
    let raf = 0, dirty = true;
    const unsub = live.subscribe(() => { dirty = true; });
    const onScroll = () => { dirty = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    let lastFrame = 0;
    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      const now = Date.now();
      // keep animating fades even if no new data
      if (!dirty && ts - lastFrame < 250) return;
      dirty = false; lastFrame = ts;
      const out: Drawn[] = [];
      for (const p of participants) {
        const e = live.data.get(p.id);
        if (!e) continue;
        const d: Drawn = { id: p.id, name: p.name, color: p.color, rects: [] };
        const ptr = e.pointer;
        if (ptr && ptr.path === myPath) {
          const age = now - ptr.t;
          const visible = ptr.touch ? age < 2500 : age < 20000;
          const pos = visible ? resolveAnchor(ptr) : null;
          if (pos) { d.x = pos.x; d.y = pos.y; d.touch = ptr.touch; d.fading = ptr.touch && age > 1500; }
        }
        if (e.sel && e.sel.path === myPath) d.rects = selectionRects(e.sel).map((r) => ({ l: r.left, t: r.top, w: r.width, h: r.height }));
        if (d.x !== undefined || d.rects.length) out.push(d);
      }
      setDrawn((prev) => (JSON.stringify(prev) === JSON.stringify(out) ? prev : out));
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); unsub(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [on, showCursors, participants, live, myPath]);

  if (!on || !showCursors || !drawn.length) return null;
  return createPortal(
    <div className="cursor-layer" aria-hidden>
      {drawn.map((d) => (
        <div key={d.id}>
          {d.rects.map((r, i) => (
            <div key={i} className="peer-sel" style={{ left: r.l, top: r.t, width: r.w, height: r.h, background: d.color }} />
          ))}
          {d.x !== undefined && (d.touch ? (
            <div className={'peer-touch' + (d.fading ? ' fading' : '')} style={{ left: d.x, top: d.y, borderColor: d.color }}>
              <span style={{ background: d.color }}>{d.name}</span>
            </div>
          ) : (
            <div className="peer-cursor" style={{ left: d.x, top: d.y }}>
              <svg width="18" height="22" viewBox="0 0 18 22"><path d="M1 1l15 9.5-6.6 1.3L13 20l-3 1.3-3.6-8.2L1 18z" fill={d.color} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              <span style={{ background: d.color }}>{d.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>,
    document.body,
  );
}
