import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF375F', '#64D2FF'];

function prettySize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SoftNexusPage() {
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
    const arr = Array.from(list);
    if (!arr.length) return;
    setFiles(prev => [...prev, ...arr]);
    if (!title) setTitle(arr[0].name.replace(/\.[^.]+$/, ''));
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
      if (res.ok && res.id) {
        out.push({
          id: res.id,
          name: file.name,
          embed: res.embed || shareUrls(res.id).embed,
          warn: res.warn,
        });
      }
    }
    setBusy(false);
    if (!out.length) {
      setError('could not publish any files');
      return;
    }
    setResults(out);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 pb-20 px-5">
      <div className="max-w-2xl mx-auto">
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
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">soft nexus</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">gather. title. share.</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-10">
            Drop several local files. They settle under one quiet title and caption with a shared accent. Each becomes its own permanent Discord-ready link. Soft size warnings only — nothing is blocked. Apple-style springs on frosted glass. Prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          animate={{ scale: dragging ? 1.01 : 1 }}
          className={`glass rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${dragging ? 'border-[#0A84FF]' : 'border-white/10'}`}
        >
          <input ref={inputRef} type="file" multiple hidden onChange={e => e.target.files && onFiles(e.target.files)} />
          <p className="text-neutral-400">drop files or click to choose</p>
          <p className="text-xs text-neutral-600 mt-2">soft warnings for large batches only</p>
        </motion.div>

        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm glass rounded-2xl px-4 py-3">
                <span className="truncate">{f.name}</span>
                <span className="text-neutral-500 text-xs">{prettySize(f.size)}</span>
              </div>
            ))}
          </motion.div>
        )}

        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-4"
          >
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="shared title"
              className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-white/20"
            />
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="quiet caption (optional)"
              rows={2}
              className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-white/20 resize-none"
            />
            <div className="flex gap-2">
              {ACCENTS.map(c => (
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
              {busy ? 'publishing…' : `publish ${files.length} share${files.length > 1 ? 's' : ''}`}
            </motion.button>
          </motion.div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              {results.map(r => (
                <div key={r.id} className="glass rounded-3xl p-6">
                  <p className="text-sm font-medium mb-1">{r.name}</p>
                  {r.warn && <p className="text-xs text-amber-400/80 mb-2">{r.warn}</p>}
                  <p className="text-xs text-neutral-500 break-all mb-3">{r.embed}</p>
                  <div className="flex gap-2">
                    <button onClick={() => copy(r.embed)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15">copy</button>
                    <button onClick={() => navigate('share', r.id)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15">open</button>
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
