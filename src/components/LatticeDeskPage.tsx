import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const ACCENTS = ['#AF52DE', '#0A84FF', '#30D158', '#FF9F0A', '#64D2FF'];

function prettySize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LatticeDeskPage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');

  const onFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list);
    if (!next.length) return;
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    setResults([]);
    setError('');
  }, []);

  const publishAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError('');
    const out: typeof results = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        cardTitle: file.name.replace(/\.[^.]+$/, ''),
        color: accent,
      });
      if (!res.ok || !res.id) {
        setError(res.error || 'could not publish');
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

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 pb-20 px-5">
      <div className="max-w-3xl mx-auto">
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
          <p className="text-[#AF52DE] text-sm font-medium tracking-wide mb-2">lattice</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">arrange the grid.</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-10">
            Drop local files into a quiet lattice. Each settles as its own permanent share with a polished Discord embed. Soft warnings only for large drops.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          animate={{ borderColor: dragging ? accent : 'rgba(255,255,255,0.08)' }}
          className="relative rounded-3xl border-2 border-dashed bg-white/[0.03] p-12 text-center cursor-pointer mb-8"
        >
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
          <p className="text-neutral-300">drop into the lattice</p>
          <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
        </motion.div>

        {files.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 20, delay: i * 0.03 }}
                  className="glass rounded-2xl p-4 text-center"
                >
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{prettySize(f.size)}</p>
                  {f.size > 40 * 1024 * 1024 && (
                    <p className="text-[10px] text-amber-400/80 mt-2">may feel slow</p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2 mb-6 justify-center">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className="w-8 h-8 rounded-full transition"
                  style={{ background: c, boxShadow: accent === c ? `0 0 0 2px #050506, 0 0 0 4px ${c}` : undefined }}
                />
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              onClick={publishAll}
              className="w-full max-w-xs mx-auto block py-3.5 rounded-full text-sm font-medium text-white disabled:opacity-50"
              style={{ background: accent }}
            >
              {busy ? 'settling…' : 'publish lattice'}
            </motion.button>
          </>
        )}

        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

        {results.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4"
              >
                <p className="text-sm font-medium mb-1 truncate">{r.name}</p>
                {r.warn && <p className="text-xs text-amber-400/80 mb-2">{r.warn}</p>}
                <p className="text-xs text-neutral-500 break-all mb-3">{r.embed}</p>
                <div className="flex gap-2">
                  <button onClick={() => copy(r.embed)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15">copy</button>
                  <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15">open</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
