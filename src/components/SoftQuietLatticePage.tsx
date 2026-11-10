import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SoftQuietLatticePage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((p) => [...p, ...arr].slice(0, 9));
    setErr('');
  };

  const updateNote = (name: string, note: string) => {
    setNotes((p) => ({ ...p, [name]: note }));
  };

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out = [];
    for (const file of files) {
      const note = notes[file.name] || caption || undefined;
      const warn = file.size > 40 * 1024 * 1024 ? 'large lattice piece. settling may feel slow. no hard limit.' : null;
      const res = await publishLocalFile(file, {
        caption: note,
        color,
        cardTitle: note || file.name,
        meta: { source: 'softquietlattice' },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || `failed for ${file.name}`);
        continue;
      }
      out.push({ id: res.id, name: file.name, embed: res.embed || shareUrls(res.id).embed, warn: res.warn || warn });
    }
    setResults(out);
    setFiles([]);
    setNotes({});
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(${color}15 1px, transparent 1px), linear-gradient(90deg, ${color}15 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '40px 40px', '0px 0px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 88, damping: 16 }}
        >
          <p className="text-[#5AC8FA] text-sm font-medium mb-2 tracking-wide">soft quiet lattice</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 leading-tight">pieces interlock into a quiet lattice.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Drop local files into a soft quiet lattice. Each can carry its own quiet note or share a caption. Subtle grid motion and staggered springs on frosted tiles. Every piece lands in storage and public_shares. Every link unfurls a polished Discord embed. Large pieces gently warned about possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            className="glass rounded-[28px] p-6 mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" id="lattice-input" onChange={(e) => onFiles(e.target.files)} />
            <label htmlFor="lattice-input" className="block text-center cursor-pointer py-8">
              <p className="text-sm text-neutral-300">drop pieces into the lattice, or click</p>
              <p className="text-xs text-neutral-500 mt-1">up to 9 · soft warning only if large</p>
            </label>
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + f.size}
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 15, delay: i * 0.05 }}
                    className="glass rounded-xl p-3 text-xs"
                  >
                    <p className="truncate text-neutral-200 mb-1">{f.name}</p>
                    <p className="text-neutral-500 mb-2">{pretty(f.size)}</p>
                    <input
                      value={notes[f.name] || ''}
                      onChange={(e) => updateNote(f.name, e.target.value)}
                      placeholder="note"
                      className="w-full bg-white/5 rounded-lg px-2 py-1 text-[11px] outline-none"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared lattice caption (optional)"
            className="w-full glass rounded-full px-4 py-3 text-sm outline-none mb-4"
          />

          <div className="flex items-center gap-3 mb-5">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-11 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">lattice accent</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={busy || !files.length}
            onClick={upload}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'interlocking…' : 'share the lattice'}
          </motion.button>

          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          <AnimatePresence>
            {results.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 mt-4"
              >
                <p className="text-sm font-medium truncate">{r.name}</p>
                {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate('share', r.id)} className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-medium">open</button>
                  <button onClick={() => navigator.clipboard.writeText(r.embed).catch(() => {})} className="px-3.5 py-1.5 rounded-full bg-white/10 text-xs">copy embed link</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
