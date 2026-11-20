/**
 * Positions are shared relative to content (the text block under the pointer),
 * not to the screen, so a cursor lands on the same words on a phone and a laptop.
 */
const ANCHORS = '[data-hl-source],[data-anchor]';

export interface AnchorPos { key: string; idx: number; fx: number; fy: number }

const keyOf = (el: Element) => {
  const h = el.getAttribute('data-hl-source');
  return h !== null ? `h:${h}` : `a:${el.getAttribute('data-anchor')}`;
};
const selectorFor = (key: string) =>
  key.startsWith('h:') ? `[data-hl-source="${CSS.escape(key.slice(2))}"]` : `[data-anchor="${CSS.escape(key.slice(2))}"]`;

function elementFor(key: string, idx: number): Element | null {
  return document.querySelectorAll(selectorFor(key))[idx] ?? null;
}
function indexOf(el: Element, key: string) {
  return Array.prototype.indexOf.call(document.querySelectorAll(selectorFor(key)), el);
}

export function anchorAt(target: EventTarget | null, x: number, y: number): AnchorPos {
  const el = target instanceof Element ? target.closest(ANCHORS) : null;
  if (el) {
    const r = el.getBoundingClientRect();
    const key = keyOf(el);
    if (r.width > 0 && r.height > 0) return { key, idx: indexOf(el, key), fx: (x - r.left) / r.width, fy: (y - r.top) / r.height };
  }
  const h = document.documentElement.scrollHeight;
  return { key: 'page', idx: 0, fx: x / window.innerWidth, fy: (y + window.scrollY) / h };
}

/** Viewport coordinates for a shared position, or null if that content isn't on screen here. */
export function resolveAnchor(p: AnchorPos): { x: number; y: number } | null {
  if (p.key === 'page') return { x: p.fx * window.innerWidth, y: p.fy * document.documentElement.scrollHeight - window.scrollY };
  const el = elementFor(p.key, p.idx);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + p.fx * r.width, y: r.top + p.fy * r.height };
}

export interface SelPos { key: string; idx: number; start: number; end: number }

/** Describe the current text selection as offsets inside one highlightable block. */
export function currentSelection(): SelPos | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const box = (node.nodeType === 1 ? (node as Element) : node.parentElement)?.closest('[data-hl-source]');
  if (!box) return null;
  const pre = document.createRange();
  pre.selectNodeContents(box);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  const end = start + range.toString().length;
  if (end <= start) return null;
  const key = keyOf(box);
  return { key, idx: indexOf(box, key), start, end };
}

/** Client rects covering [start, end) characters of a block's text. */
export function selectionRects(s: SelPos): DOMRect[] {
  const box = elementFor(s.key, s.idx);
  if (!box) return [];
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0, started = false;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (!started && s.start < pos + len) { range.setStart(n, s.start - pos); started = true; }
    if (started && s.end <= pos + len) { range.setEnd(n, s.end - pos); return Array.from(range.getClientRects()); }
    pos += len;
  }
  return [];
}
