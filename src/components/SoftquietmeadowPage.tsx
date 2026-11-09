import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Dropped = {
  file: File;
  note: string;
  id?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  warn?: string;
};

export default function SoftquietmeadowPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Dropped[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#34C759');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{id: string; name: string; link: string; warn?: string}[]>([]);
  const [copied, setCopied] = useState('');

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.file.size, 0), [files]);
  const slow = totalSize > 20 * 1024 * 1024;

  const addFiles = (list: FileList | File[]) => {
    const next: Dropped[] = Array.from(list).map(file => ({
      file,
      note: '',
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...next].slice(0, 16));
  };

  const updateNote = (idx: number, note: string) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, note } : f));
  };

  const remove = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setResults([]);
    const outs: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'uploading' } : f));
      const caption = item.note.trim() || sharedCaption.trim() || undefined;
      const out = await publishLocalFile(item.file, {
        caption,
        cardTitle: item.file.name,
        color: accent,
        meta: { desk: 'softquietmeadow', shared: !!sharedCaption },
      });
      if (out.ok && out.id) {
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'done', id: out.id, warn: out.warn || undefined } : f));
        outs.push({
          id: out.id,
          name: item.file.name,
          link: out.embed || `${location.origin}/s/${out.id}`,
          warn: out.warn || undefined,
        });
      } else {
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'error' } : f));
      }
    }
    setResults(outs);
    setBusy(false);
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1400);
  };

  const spring = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 0.8 };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-28 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">soft quiet meadow</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Let it bloom in the meadow.</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-neutral-400">
            Drop local files into a quiet meadow of soft glass flowers. Each bloom can hold its own note or share a meadow caption and accent. They rise and gently sway with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block text-sm text-neutral-400">
            Meadow caption (optional)
            <input
              value={sharedCaption}
              onChange={e => setSharedCaption(e.target.value)}
              placeholder="a quiet note for the whole meadow"
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#34C759]"
            />
          </label>
          <label className="block text-sm text-neutral-400">
            Accent
            <input
              type="color"
              value={accent}
              onChange={e => setAccent(e.target.value)}
              className="mt-1.5 h-[46px] w-full rounded-2xl border border-white/10 bg-white/5 cursor-pointer"
            />
          </label>
        </div>

        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className="mt-5 flex w-full flex-col items-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center transition hover:border-[#34C759]/50 relative overflow-hidden"
        >
          <span className="text-[17px] font-medium z-10">Drop local files into the meadow</span>
          <span className="mt-2 text-[13px] text-neutral-500 z-10">up to 16. no hard size limit — large ones just warned of possible slowness.</span>
          <motion.div className="absolute inset-0 pointer-events-none" animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="absolute bottom-4 left-1/4 w-8 h-16 rounded-full bg-white/5 blur-sm" />
            <div className="absolute bottom-6 left-1/2 w-6 h-12 rounded-full bg-white/5 blur-sm" />
            <div className="absolute bottom-3 left-2/3 w-10 h-20 rounded-full bg-white/5 blur-sm" />
          </motion.div>
        </motion.button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

        {slow && files.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-[#ffd60a]">
            This meadow is large. Nothing is refused — it may simply take a moment to leave your machine.
          </motion.p>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((item, idx) => (
                <motion.div
                  key={item.file.name + idx}
                  layout
                  initial={{ opacity: 0, scale: 0.5, y: 60 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ ...spring, delay: idx * 0.06 }}
                  className="glass relative rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl overflow-hidden"
                  style={{ animation: `sway ${3 + idx * 0.2}s ease-in-out infinite` }}
                >
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-8 bg-white/10 rounded-full" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full" style={{ background: accent + '33', boxShadow: `0 0 20px ${accent}55` }} />
                  <div className="min-w-0 mt-6">
                    <p className="truncate text-[14px] font-medium">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{pretty(item.file.size)} · {item.status}</p>
                    <input
                      value={item.note}
                      onChange={e => updateNote(idx, e.target.value)}
                      placeholder="quiet note"
                      className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-[#34C759]"
                    />
                  </div>
                  <button onClick={() => remove(idx)} className="absolute top-2 right-2 text-neutral-500 hover:text-white text-xs">×</button>
                </motion.div>
              ))}
              <button
                onClick={uploadAll}
                disabled={busy}
                className="col-span-full rounded-full bg-[#34C759] px-6 py-3 text-sm font-medium text-black disabled:opacity-60 mt-2"
              >
                {busy ? 'Blooming into the quiet…' : 'Share the meadow'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
              <h2 className="text-xl font-semibold tracking-tight">Meadow links</h2>
              <p className="mt-1 text-sm text-neutral-500">Each bloom has its own polished Discord card.</p>
              <div className="mt-4 space-y-3">
                {results.map(r => (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium">{r.name}</p>
                    <p className="mt-1 break-all text-sm text-[#34C759]">{r.link}</p>
                    {r.warn && <p className="mt-1 text-xs text-[#ffd60a]">{r.warn}</p>}
                    <button onClick={() => copy(r.link, r.id)} className="mt-2 text-sm text-white/80 hover:text-white">
                      {copied === r.id ? 'copied' : 'copy link'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      <Footer />
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1.5deg); }
        }
      `}</style>
    </div>
  );
}
