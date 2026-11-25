import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const ACCENTS = ['#FF9F0A', '#FFD60A', '#30D158', '#64D2FF', '#0A84FF'];

function prettySize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function DailyLumenPage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('today');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  const onFiles = useCallback((list: FileList | File[]) => {
    const f = Array.from(list)[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
  }, []);

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    let res;
    if (file) {
      res = await publishLocalFile(file, {
        cardTitle: title.trim() || 'today',
        caption: note.trim() || undefined,
        color: accent,
      });
    } else {
      // pure note as text file
      const blob = new Blob([note || 'quiet day'], { type: 'text/plain' });
      const textFile = new File([blob], `${title.trim() || 'today'}.txt`, { type: 'text/plain' });
      res = await publishLocalFile(textFile, {
        cardTitle: title.trim() || 'today',
        caption: note.trim() || undefined,
        color: accent,
      });
    }
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'could not publish');
      return;
    }
    setResult({ id: res.id, embed: res.embed || shareUrls(res.id).embed, warn: res.warn });
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 pb-20 px-5">
      <div className="max-w-xl mx-auto">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('home')}
          className="text-xs text-neutral-500 hover:text-white mb-8"
        >
          ← home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <p className="text-[#FF9F0A] text-sm font-medium tracking-wide mb-2">daily lumen</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">a quiet day. optional file.</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-10">
            Shape a short reflection. Drop an optional local file if it fits the moment. Permanent Discord-ready link. Soft size warnings only — nothing blocked.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          animate={{ borderColor: dragging ? accent : 'rgba(255,255,255,0.08)', scale: dragging ? 1.01 : 1 }}
          className="relative rounded-3xl border-2 border-dashed bg-white/[0.03] p-8 text-center cursor-pointer transition-colors mb-6"
        >
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-neutral-500 mt-1">{prettySize(file.size)} · {file.type || 'unknown'}</p>
                {file.size > 40 * 1024 * 1024 && (
                  <p className="text-xs text-amber-400/90 mt-3">large file — browser may feel slow. no hard limit.</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-neutral-300">optional: drop a file</p>
                <p className="text-xs text-neutral-500 mt-1">or skip and share the note alone</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title for the day"
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet reflection…"
            rows={4}
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20 resize-none"
          />
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                className="w-7 h-7 rounded-full transition"
                style={{ background: c, boxShadow: accent === c ? `0 0 0 2px #050506, 0 0 0 4px ${c}` : undefined }}
              />
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={busy || (!file && !note.trim())}
            onClick={publish}
            className="w-full py-3.5 rounded-full text-sm font-medium text-white disabled:opacity-50"
            style={{ background: accent }}
          >
            {busy ? 'publishing…' : 'publish daily lumen'}
          </motion.button>
        </motion.div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 glass rounded-3xl p-6"
            >
              <p className="text-sm font-medium mb-1">lumen ready</p>
              {result.warn && <p className="text-xs text-amber-400/80 mb-3">{result.warn}</p>}
              <p className="text-xs text-neutral-500 break-all mb-4">{result.embed}</p>
              <div className="flex gap-2">
                <button onClick={() => copy(result.embed)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15">copy link</button>
                <button onClick={() => navigate('share', result.id)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15">open</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
