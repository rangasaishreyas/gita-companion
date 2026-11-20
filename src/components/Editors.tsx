import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import type { Note, NoteKind, Highlight, HighlightColor, UserAnecdote } from '../db/schema';
import { saveNote, deleteNote, saveHighlight, deleteHighlight, saveAnecdote, deleteAnecdote } from '../db/repo';
import { toast } from './Toast';

export const noteKinds: Array<{ k: NoteKind; label: string }> = [
  { k: 'observation', label: 'Observation' },
  { k: 'learning', label: 'Learning' },
  { k: 'question', label: 'Question' },
];
export const colors: HighlightColor[] = ['saffron', 'green', 'blue', 'rose'];

const parseTags = (s: string) => s.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);

export function NoteEditor({ open, onClose, note, verseId }: { open: boolean; onClose: () => void; note?: Note; verseId?: string }) {
  const [kind, setKind] = useState<NoteKind>('observation');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  useEffect(() => {
    if (open) { setKind(note?.kind ?? 'observation'); setBody(note?.body ?? ''); setTags(note?.tags.join(', ') ?? ''); }
  }, [open, note]);
  const save = async () => {
    if (!body.trim()) return;
    await saveNote({ id: note?.id, verseId: note?.verseId ?? verseId, kind, body: body.trim(), tags: parseTags(tags) });
    toast(note ? 'Note updated' : 'Note saved'); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={note ? 'Edit note' : `New note${verseId ? ' · ' + verseId : ''}`}>
      <div className="chips" style={{ marginBottom: 10 }}>
        {noteKinds.map((k) => <button key={k.k} className={'chip' + (kind === k.k ? ' on' : '')} onClick={() => setKind(k.k)}>{k.label}</button>)}
      </div>
      <textarea className="field" autoFocus placeholder={kind === 'question' ? 'What are you wondering about?' : kind === 'learning' ? 'What did you learn?' : 'What did you notice?'}
        value={body} onChange={(e) => setBody(e.target.value)} />
      <input className="field" style={{ marginTop: 10 }} placeholder="Tags, comma separated (e.g. detachment, work)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <div className="row" style={{ marginTop: 14 }}>
        {note && <button className="btn danger" onClick={async () => { await deleteNote(note.id); toast('Note deleted'); onClose(); }}>Delete</button>}
        <span className="spacer" />
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!body.trim()} onClick={save}>Save</button>
      </div>
    </Sheet>
  );
}

export function HighlightEditor({ open, onClose, hl }: { open: boolean; onClose: () => void; hl?: Highlight }) {
  const [color, setColor] = useState<HighlightColor>('saffron');
  const [note, setNote] = useState('');
  useEffect(() => { if (hl) { setColor(hl.color); setNote(hl.note ?? ''); } }, [hl]);
  if (!hl) return null;
  return (
    <Sheet open={open} onClose={onClose} title="Highlight">
      <p className="note quote" style={{ margin: '0 0 14px' }}>“{hl.text}”</p>
      <div className="small muted" style={{ marginBottom: 8 }}>{hl.verseId} · {hl.sourceLabel}</div>
      <div className="row" style={{ marginBottom: 12 }}>
        {colors.map((c) => <button key={c} aria-label={c} className={`swatch ${c}${color === c ? ' on' : ''}`} onClick={() => setColor(c)} />)}
      </div>
      <textarea className="field" placeholder="Add a reflection on this passage…" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn danger" onClick={async () => { await deleteHighlight(hl.id); toast('Highlight removed'); onClose(); }}>Remove</button>
        <span className="spacer" />
        <button className="btn" onClick={async () => { await saveHighlight({ ...hl, color, note: note.trim() || undefined }); toast('Saved'); onClose(); }}>Save</button>
      </div>
    </Sheet>
  );
}

export function AnecdoteEditor({ open, onClose, item, verseId }: { open: boolean; onClose: () => void; item?: UserAnecdote; verseId: string }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [source, setSource] = useState('');
  useEffect(() => { if (open) { setTitle(item?.title ?? ''); setBody(item?.body ?? ''); setSource(item?.source ?? ''); } }, [open, item]);
  return (
    <Sheet open={open} onClose={onClose} title={item ? 'Edit anecdote' : `Add an anecdote · ${verseId}`}>
      <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="field" style={{ marginTop: 10, minHeight: 160 }} placeholder="The story, example or experience that this verse brings to mind…" value={body} onChange={(e) => setBody(e.target.value)} />
      <input className="field" style={{ marginTop: 10 }} placeholder="Source (book, teacher, talk, personal…)" value={source} onChange={(e) => setSource(e.target.value)} />
      <div className="row" style={{ marginTop: 14 }}>
        {item && <button className="btn danger" onClick={async () => { await deleteAnecdote(item.id); onClose(); }}>Delete</button>}
        <span className="spacer" />
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!body.trim()} onClick={async () => {
          await saveAnecdote({ id: item?.id, verseId, chapter: Number(verseId.split('.')[0]), title: title.trim() || 'Untitled', body: body.trim(), source: source.trim() });
          toast('Anecdote saved'); onClose();
        }}>Save</button>
      </div>
    </Sheet>
  );
}
