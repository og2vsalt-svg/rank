import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function QuietNotesPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<CloudMeta[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const loadNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const all = await listPublicShares(48);
      const textNotes = all.filter(
        (s) =>
          (s.type || '').startsWith('text/') ||
          (s.name || '').toLowerCase().endsWith('.txt') ||
          (s.caption || '').toLowerCase().includes('note')
      );
      setNotes(textNotes.slice(0, 12));
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const saveNote = async () => {
    if (!body.trim()) return;
    setStatus('saving');
    setError('');
    setResult(null);
    try {
      const name = (title.trim() || 'quiet-note') + '.txt';
      const file = new File([body], name, { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: title.trim() || 'a quiet note',
        color,
        cardTitle: title.trim() || 'Quiet Note',
        author: 'rankvault notes',
        meta: { kind: 'note' },
      });
      if (!res.ok || !res.id) {
        setError(res.error || 'could not save the note');
        setStatus('error');
        return;
      }
      const urls = shareUrls(res.id);
      setResult({ id: res.id, embed: urls.embed, warn: res.warn || null });
      setStatus('done');
      setBody('');
      setTitle('');
      loadNotes();
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 mb-8"
        >
          <p className="text-sm text-[#0A84FF] mb-2 tracking-wide">quiet notes</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">write something that stays.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            A small desk for short notes. They upload as plain text to the database and receive professional Discord embeds on every link. Soft size warnings only — no hard limits. All prior file desks remain untouched.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional title"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write the note…"
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full border border-white/20 cursor-pointer bg-transparent"
            />
          </div>

          {body.length > 50000 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-3">
              long note. the browser may feel slow while it saves. no hard limit.
            </motion.p>
          )}

          <button
            onClick={saveNote}
            disabled={status === 'saving' || !body.trim()}
            className="w-full py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-50 transition hover:bg-neutral-100"
          >
            {status === 'saving' ? 'saving…' : 'save & share'}
          </button>

          <AnimatePresence>
            {status === 'done' && result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <p className="text-xs text-neutral-400 mb-2">saved. copy the embed link:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-black/30 rounded-xl px-3 py-2 truncate">{result.embed}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.embed)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-xs hover:bg-white/20"
                  >
                    copy
                  </button>
                </div>
                {result.warn && <p className="text-[11px] text-amber-400 mt-2">{result.warn}</p>}
              </motion.div>
            )}
            {status === 'error' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-3">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div>
          <h2 className="text-lg font-medium mb-4 tracking-tight">recent quiet notes</h2>
          {loadingNotes ? (
            <p className="text-sm text-neutral-500">gathering…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-neutral-500">no notes yet. write the first one.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n, i) => (
                <motion.a
                  key={n.id}
                  href={shareUrls(n.id).app}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
                >
                  <p className="text-sm font-medium truncate">{n.name || 'untitled note'}</p>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{n.caption || 'a quiet note'}</p>
                  <p className="text-[11px] text-neutral-600 mt-2">{prettySize(n.size)} · {n.downloads || 0} views</p>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
