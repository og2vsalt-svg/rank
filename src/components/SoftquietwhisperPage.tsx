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

export default function SoftquietwhisperPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Dropped[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#5E5CE6');
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
        meta: { desk: 'softquietwhisper', shared: !!sharedCaption },
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

  const spring = { type: 'spring' as const, stiffness: 240, damping: 20, mass: 0.75 };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-28 pt-28">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">soft quiet whisper</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Let it pass as a whisper.</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-neutral-400">
            Drop local files into a quiet field of soft pulses. Each whisper can carry its own note or share a single caption and accent. They rise and settle with gentle spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block text-sm text-neutral-400">
            Shared whisper (optional)
            <input
              value={sharedCaption}
              onChange={e => setSharedCaption(e.target.value)}
              placeholder="a quiet note for every whisper"
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#5E5CE6]"
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
          whileHover={{ scale: 1.004 }}
          whileTap={{ scale: 0.996 }}
          className="mt-5 flex w-full flex-col items-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center transition hover:border-[#5E5CE6]/50 relative overflow-hidden"
        >
          <span className="text-[17px] font-medium z-10">Drop local files into the whisper</span>
          <span className="mt-2 text-[13px] text-neutral-500 z-10">up to 16. no hard size limit — large ones just warned of possible slowness.</span>
          <motion.div className="absolute inset-0 pointer-events-none" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/10" style={{ boxShadow: `0 0 40px ${accent}33` }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/15" />
          </motion.div>
        </motion.button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

        {slow && files.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-[#ffd60a]">
            This whisper is large. Nothing is refused — it may simply take a moment to leave your machine.
          </motion.p>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((item, idx) => (
                <motion.div
                  key={item.file.name + idx}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ ...spring, delay: idx * 0.04 }}
                  className="glass relative rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl overflow-hidden"
                  style={{ animation: `whisperpulse ${3.2 + idx * 0.25}s ease-in-out infinite` }}
                >
                  <div className="absolute inset-0 rounded-3xl opacity-40" style={{ background: `radial-gradient(circle at 50% 0%, ${accent}22, transparent 70%)` }} />
                  <div className="min-w-0 relative">
                    <p className="truncate text-[14px] font-medium">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{pretty(item.file.size)} · {item.status}</p>
                    <input
                      value={item.note}
                      onChange={e => updateNote(idx, e.target.value)}
                      placeholder="whisper note"
                      className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-[#5E5CE6]"
                    />
                  </div>
                  <button onClick={() => remove(idx)} className="absolute top-2 right-2 text-neutral-500 hover:text-white text-xs z-10">×</button>
                </motion.div>
              ))}
              <button
                onClick={uploadAll}
                disabled={busy}
                className="col-span-full rounded-full bg-[#5E5CE6] px-6 py-3 text-sm font-medium text-white disabled:opacity-60 mt-2"
              >
                {busy ? 'Passing the whispers…' : 'Share the whispers'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
              <h2 className="text-xl font-semibold tracking-tight">Whisper links</h2>
              <p className="mt-1 text-sm text-neutral-500">Each link unfurls a polished Discord card.</p>
              <div className="mt-4 space-y-3">
                {results.map(r => (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium">{r.name}</p>
                    <p className="mt-1 break-all text-sm text-[#5E5CE6]">{r.link}</p>
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
        @keyframes whisperpulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.015); opacity: 0.96; }
        }
      `}</style>
    </div>
  );
}
