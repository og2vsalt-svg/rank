import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const ACCENTS = ['#0A84FF', '#30D158', '#FFD60A', '#FF3B30', '#AF52DE', '#64D2FF', '#FF9F0A'];

function prettySize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CascadePage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');

  const onFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list);
    if (!next.length) return;
    setFiles((prev) => [...prev, ...next]);
    if (!title) setTitle(next[0].name.replace(/\.[^.]+$/, ''));
    setResults([]);
    setError('');
  }, [title]);

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError('');
    const out: typeof results = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        cardTitle: title.trim() || file.name,
        caption: caption.trim() || undefined,
        color: accent,
      });
      if (!res.ok || !res.id) {
        setError(res.error || `failed on ${file.name}`);
        setBusy(false);
        return;
      }
      out.push({ id: res.id, name: file.name, embed: res.embed || shareUrls(res.id).embed, warn: res.warn });
    }
    setResults(out);
    setBusy(false);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  const totalSize = files.reduce((a, f) => a + f.size, 0);

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
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">cascade</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">many files. one voice.</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-10">
            Drop several local files. They cascade into permanent shares under a shared title, caption, and accent. Soft size notes only — nothing blocked. Discord embeds on every link.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          animate={{ borderColor: dragging ? accent : 'rgba(255,255,255,0.08)', scale: dragging ? 1.01 : 1 }}
          className="relative rounded-3xl border-2 border-dashed bg-white/[0.03] p-10 text-center cursor-pointer transition-colors"
        >
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
          <AnimatePresence mode="wait">
            {files.length ? (
              <motion.div key="files" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-lg font-medium">{files.length} file{files.length > 1 ? 's' : ''}</p>
                <p className="text-sm text-neutral-500 mt-1">{prettySize(totalSize)}</p>
                {totalSize > 40 * 1024 * 1024 && (
                  <p className="text-xs text-amber-400/90 mt-3">large cascade — the browser may feel slow while it uploads. no hard limit.</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-neutral-300">drop files here</p>
                <p className="text-xs text-neutral-500 mt-1">or click to browse · multiple ok</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="shared title for the cards"
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional shared caption"
              rows={2}
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
              disabled={busy}
              onClick={publish}
              className="w-full py-3.5 rounded-full text-sm font-medium text-white disabled:opacity-50"
              style={{ background: accent }}
            >
              {busy ? 'cascading…' : 'publish cascade'}
            </motion.button>
          </motion.div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-3"
            >
              <p className="text-sm font-medium">shares ready</p>
              {results.map((r) => (
                <div key={r.id} className="glass rounded-2xl p-4">
                  <p className="text-xs text-neutral-400 truncate">{r.name}</p>
                  {r.warn && <p className="text-xs text-amber-400/80 mt-1">{r.warn}</p>}
                  <p className="text-xs text-neutral-500 break-all mt-2">{r.embed}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => copy(r.embed)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15">copy</button>
                    <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15">open</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
