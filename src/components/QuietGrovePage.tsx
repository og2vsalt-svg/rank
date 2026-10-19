import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

export default function QuietGrovePage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelect = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the upload may feel slow. no hard limit.' : '');
    setFiles(arr);
    setErr('');
    setResults([]);
  };

  const publishAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    setResults([]);
    const next: { id: string; name: string; url: string }[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: file.name,
        });
        if (!res.ok || !res.id) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
        next.push({ id: res.id, name: file.name, url: shareUrls(res.id).app });
      }
      setResults(next);
      if (next.length && next[0]) {
        try { await navigator.clipboard.writeText(next[0].url); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-10 relative overflow-hidden"
        >
          {/* soft vertical stems of light */}
          <div className="absolute inset-0 pointer-events-none opacity-45">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute bottom-0"
                style={{
                  width: 4 + i * 2,
                  left: `${12 + i * 16}%`,
                  height: '70%',
                  background: `linear-gradient(to top, ${color}55, transparent)`,
                  borderRadius: '999px',
                  filter: 'blur(1px)',
                }}
                animate={{
                  scaleY: [0.6, 1, 0.75, 1],
                  x: [0, 3, -2, 0],
                  opacity: [0.4, 0.8, 0.5, 0.4],
                }}
                transition={{
                  duration: 7 + i * 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                }}
              />
            ))}
          </div>

          <p className="text-sm font-medium tracking-wide mb-2" style={{ color }}>quiet grove</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">quiet growing light trees for what you carry</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-md">
            Drop files. They land in storage and the public shares table. Soft vertical stems of light gently grow, sway, and breathe upward in your color, like a quiet grove. Spring motion, glass surfaces. Large files warned, never refused.
          </p>

          <div className="space-y-5 relative z-10">
            <label
              className="block cursor-pointer rounded-3xl border border-dashed border-white/15 hover:border-white/30 p-10 text-center transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onSelect(e.dataTransfer.files); }}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onSelect(e.target.files)}
              />
              <p className="font-medium">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready` : 'click or drop files'}</p>
              <p className="text-xs text-neutral-500 mt-1">no hard limit. only a soft warning if a drop is heavy.</p>
            </label>

            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer"
                title="accent color"
              />
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="shared note (optional)"
                className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-white/25"
              />
            </div>

            {files.length > 0 && (
              <ul className="text-xs text-neutral-400 space-y-1">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name} · {pretty(f.size)}</li>
                ))}
              </ul>
            )}

            <button
              disabled={busy || !files.length}
              onClick={publishAll}
              className="w-full py-3.5 rounded-full bg-white text-black font-medium disabled:opacity-40 transition"
            >
              {busy ? 'growing the grove…' : 'set & share'}
            </button>

            {warn && <p className="text-xs text-amber-300/80">{warn}</p>}
            {err && <p className="text-xs text-red-400">{err}</p>}

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2"
                >
                  <p className="text-sm text-neutral-300">grove set. first link copied.</p>
                  {results.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <span className="truncate flex-1 text-neutral-400">{r.name}</span>
                      <button
                        onClick={() => navigate('share', r.id)}
                        className="px-3 py-1.5 rounded-full bg-white/10"
                      >open</button>
                      <button
                        onClick={async () => { try { await navigator.clipboard.writeText(r.url); } catch {} }}
                        className="px-3 py-1.5 rounded-full bg-white/10"
                      >copy</button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
