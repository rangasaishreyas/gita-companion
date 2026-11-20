import { useMemo } from 'react';
import type { Highlight } from '../db/schema';

/**
 * Renders text with saved highlights. The DOM text content always equals `text`
 * exactly, so selection offsets map 1:1 to stored start/end offsets.
 */
export function HighlightText({ text, source, sourceLabel, highlights, lang, onTapHighlight, className = 'textblock' }: {
  text: string; source: string; sourceLabel: string; highlights: Highlight[]; lang?: string;
  onTapHighlight?: (h: Highlight) => void; className?: string;
}) {
  const pieces = useMemo(() => {
    const hs = highlights.filter((h) => h.source === source && h.end <= text.length && text.slice(h.start, h.end) === h.text)
      .sort((a, b) => a.start - b.start);
    const subheads: Array<[number, number]> = [];
    const re = /(^|\n)(Commentary)(?=\n)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) subheads.push([m.index + m[1].length, m.index + m[1].length + m[2].length]);

    const cuts = new Set([0, text.length]);
    hs.forEach((h) => { cuts.add(h.start); cuts.add(h.end); });
    subheads.forEach(([a, b]) => { cuts.add(a); cuts.add(b); });
    const sorted = [...cuts].sort((a, b) => a - b);
    const out: Array<{ s: string; h?: Highlight; sub?: boolean; k: number }> = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (a === b) continue;
      out.push({ s: text.slice(a, b), k: a, h: hs.find((h) => h.start <= a && h.end >= b), sub: subheads.some(([x, y]) => x <= a && y >= b) });
    }
    return out;
  }, [text, source, highlights]);

  return (
    <div className={className} lang={lang} data-hl-source={source} data-hl-label={sourceLabel}>
      {pieces.map((p) => {
        const inner = p.sub ? <span className="subhead">{p.s}</span> : p.s;
        return p.h ? (
          <mark key={p.k} className={`hl ${p.h.color}${p.h.note ? ' has-note' : ''}`}
            onClick={() => { if (window.getSelection()?.isCollapsed !== false) onTapHighlight?.(p.h!); }}>
            {inner}
          </mark>
        ) : <span key={p.k}>{inner}</span>;
      })}
    </div>
  );
}

export interface PendingSelection { source: string; sourceLabel: string; start: number; end: number; text: string }

/** Reads the current DOM selection if it lies within a single highlightable block. */
export function readSelection(): PendingSelection | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const el = (n: Node | null) => (n && n.nodeType === 1 ? (n as Element) : n?.parentElement ?? null);
  const box = el(range.startContainer)?.closest('[data-hl-source]');
  if (!box || box !== el(range.endContainer)?.closest('[data-hl-source]')) return null;
  const pre = document.createRange();
  pre.selectNodeContents(box);
  pre.setEnd(range.startContainer, range.startOffset);
  let start = pre.toString().length;
  let txt = range.toString();
  // trim whitespace at edges so highlights look clean
  const lead = txt.length - txt.trimStart().length;
  start += lead; txt = txt.trim();
  if (!txt) return null;
  return { source: box.getAttribute('data-hl-source')!, sourceLabel: box.getAttribute('data-hl-label') ?? '', start, end: start + txt.length, text: txt };
}
