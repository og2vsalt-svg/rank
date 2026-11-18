import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietLumenPathPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [shared, setShared] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{name: string; embed: string; warn?: string | null}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles(f => [...f, ...next]);
    setCaptions(c => [...c, ...next.map(() => '')]);
  };

  const remove = (i: number) => {
    setFiles(f => f.filter((_, idx) => idx !== i));
    setCaptions(c => c.filter((_, idx) => idx !== i));
  };

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError(null);
    setLinks([]);
    try {
      const out = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cap = captions[i]?.trim() || shared.trim() || file.name;
        const res = await publishLocalFile(file, {
          caption: cap,
          color: accent,
          cardTitle: 'Quiet Lumen Path',
          meta: { desk: 'quietlumenpath', step: i + 1, total: files.length },
        });
        if (res.ok && res.embed) {
          out.push({ name: file.name, embed: res.embed, warn: res.warn || null });
        } else {
          throw new Error(res.error || `issue with ${file.name}`);
        }
      }
      setLinks(out);
    } catch (e: any) {
      setError(e.message || 'the path paused');
    }
    setBusy(false);
  };

  const large = files.some(f => f.size > 40 * 1024 * 1024);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 relative"
        >
          <div className="absolute inset-0 pointer-events-none rounded-[36px] overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(180deg, ${accent}22, transparent 60%)` }} />
          </div>
          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Quiet Lumen Path</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Follow the soft light path.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Drop local files in sequence. They settle along a flowing path of soft light with staggered spring reveals on frosted glass. Give each its own quiet caption, or share one for the whole path. They publish independently to the database. Every share link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style springs. All prior desks remain fully intact.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className="relative mb-6 rounded-3xl border-2 border-dashed border-white/15 hover:border-white/30 transition p-10 text-center cursor-pointer bg-black/20"
          >
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-neutral-300 text-sm">drop files onto the path, or click</p>
            <p className="text-neutral-500 text-xs mt-1">soft size warnings only</p>
          </div>

          {large && <p className="text-xs text-amber-300/80 mb-4">large drop. the browser may feel slow while it sends. nothing is refused.</p>}

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + f.size + i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                className="flex items-center gap-3 mb-3 glass rounded-2xl p-3 relative"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB · step {i + 1}</p>
                </div>
                <input
                  value={captions[i] || ''}
                  onChange={(e) => {
                    const n = [...captions];
                    n[i] = e.target.value;
                    setCaptions(n);
                  }}
                  placeholder="path caption"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-600"
                />
                <button onClick={() => remove(i)} className="text-xs text-neutral-500 hover:text-white px-2">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            value={shared}
            onChange={(e) => setShared(e.target.value)}
            placeholder="Optional shared caption for the whole path"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <label className="flex items-center gap-3 mb-6 text-sm text-neutral-400">
            path accent
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
          </label>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {links.length > 0 && (
            <div className="mb-6 space-y-2">
              {links.map((l) => (
                <div key={l.embed} className="text-sm">
                  <a href={l.embed} target="_blank" rel="noreferrer" className="text-blue-400 underline break-all">{l.embed}</a>
                  {l.warn && <p className="text-xs text-amber-300/80 mt-0.5">{l.warn}</p>}
                </div>
              ))}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Following the path…' : files.length ? `Publish path of ${files.length}` : 'Drop files first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
