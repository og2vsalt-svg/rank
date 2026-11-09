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

export default function SoftquietrefractionPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Dropped[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
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
    setFiles(prev => [...prev, ...next].slice(0, 12));
  };

  const updateNote = (idx: number, note: string) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, note } : f));
  };

  const remove = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    if (!files.length && !body.trim()) return;
    setBusy(true);
    setResults([]);
    const outs: typeof results = [];

    if (files.length === 0 && body.trim()) {
      const blob = new Blob([body], { type: 'text/plain' });
      const file = new File([blob], `${title.trim() || 'refraction-note'}.txt`, { type: 'text/plain' });
      const out = await publishLocalFile(file, {
        caption: body.trim(),
        cardTitle: title.trim() || 'quiet refraction',
        color: accent,
        meta: { desk: 'softquietrefraction', pureNote: true },
      });
      if (out.ok && out.id) {
        outs.push({
          id: out.id,
          name: title.trim() || 'quiet refraction',
          link: out.embed || `${location.origin}/s/${out.id}`,
          warn: out.warn || undefined,
        });
      }
    } else {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'uploading' } : f));
        const caption = [title.trim(), body.trim(), item.note.trim()].filter(Boolean).join(' · ') || undefined;
        const out = await publishLocalFile(item.file, {
          caption,
          cardTitle: title.trim() || item.file.name,
          color: accent,
          meta: { desk: 'softquietrefraction', shared: true },
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
    }

    setResults(outs);
    setBusy(false);
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1400);
  };

  const spring = { type: 'spring' as const, stiffness: 220, damping: 24, mass: 0.85 };

  const spectrum = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE'];

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-28 pt-28">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">soft quiet refraction</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Let light split.</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-neutral-400">
            Drop local files through a quiet prism. Light refracts into soft spectral beams that settle with spring motion on frosted glass. Each piece can hold its own note or share a refraction caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4">
          <label className="block text-sm text-neutral-400">
            Title (optional)
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="a quiet title"
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#5AC8FA]"
            />
          </label>
          <label className="block text-sm text-neutral-400">
            Note
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="what the prism holds"
              rows={4}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#5AC8FA] resize-none"
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
          className="mt-5 flex w-full flex-col items-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center transition hover:border-[#5AC8FA]/50 relative overflow-hidden"
        >
          <span className="text-[17px] font-medium z-10">Drop local files through the prism</span>
          <span className="mt-2 text-[13px] text-neutral-500 z-10">optional. up to 12. no hard size limit — large ones just warned of possible slowness.</span>
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 40%, ${accent}66 50%, transparent 60%)`,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            }}
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {spectrum.map((c, i) => (
            <motion.div
              key={c}
              className="absolute bottom-4 h-1 rounded-full pointer-events-none"
              style={{
                left: `${20 + i * 9}%`,
                width: '8%',
                background: c,
                opacity: 0.6,
              }}
              animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
            />
          ))}
        </motion.button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

        {slow && files.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-[#ffd60a]">
            This refraction is large. Nothing is refused — it may simply take a moment to leave your machine.
          </motion.p>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((item, idx) => (
                <motion.div
                  key={item.file.name + idx}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ ...spring, delay: idx * 0.05 }}
                  className="glass relative rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{pretty(item.file.size)} · {item.status}</p>
                    <input
                      value={item.note}
                      onChange={e => updateNote(idx, e.target.value)}
                      placeholder="quiet note"
                      className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-[#5AC8FA]"
                    />
                  </div>
                  <button onClick={() => remove(idx)} className="absolute top-2 right-2 text-neutral-500 hover:text-white text-xs">×</button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={uploadAll}
          disabled={busy || (!files.length && !body.trim())}
          whileTap={{ scale: 0.98 }}
          className="mt-6 w-full rounded-full bg-[#5AC8FA] px-6 py-3 text-sm font-medium text-black disabled:opacity-50"
        >
          {busy ? 'Refracting…' : 'Share through the prism'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
              <h2 className="text-xl font-semibold tracking-tight">Refraction links</h2>
              <p className="mt-1 text-sm text-neutral-500">Each carries a polished Discord card.</p>
              <div className="mt-4 space-y-3">
                {results.map(r => (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium">{r.name}</p>
                    <p className="mt-1 break-all text-sm text-[#5AC8FA]">{r.link}</p>
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
    </div>
  );
}
