import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftlumenquayPage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [results, setResults] = useState<{id: string; url: string; name: string}[]>([]);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    setWarn('');
    const list = Array.from(files);
    const newResults = [];
    for (const file of list) {
      const w = file.size > 35 * 1024 * 1024 ? 'Large file — the quay may take a moment, but nothing is refused.' : '';
      if (w) setWarn(w);
      const res = await publishLocalFile(file, { caption: note || 'moored at softlumenquay', color: accent, meta: { desk: 'softlumenquay' } });
      if (res.ok && res.id) {
        const url = `${window.location.origin}/s/${res.id}`;
        newResults.push({ id: res.id, url, name: file.name });
      } else {
        setWarn(res.error || 'One mooring failed');
      }
    }
    setResults(prev => [...newResults, ...prev]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-12">
          <p className="text-sm font-medium tracking-wide mb-3" style={{ color: accent }}>softlumenquay</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">a still quay for what you carry</h1>
          <p className="text-neutral-400 text-lg">Soft pilings of light hold your files and notes. Drop anything local; it moors in storage and the public record. Spring motion, frosted glass, professional Discord cards on every link.</p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8">
          <label className="block text-sm text-neutral-400 mb-2">mooring note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="a quiet line to travel with the files…"
            className="w-full bg-black/30 rounded-2xl p-4 text-white placeholder-neutral-500 outline-none focus:ring-1 focus:ring-white/20 resize-none"
            rows={3}
          />
          <div className="flex items-center gap-4 mt-4">
            <label className="text-sm text-neutral-400">accent</label>
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-500">{accent}</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.5 }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative mx-auto h-56 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer grid place-items-center ${drag ? 'border-white/40 bg-white/10 scale-[1.015]' : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8'}`}
          style={{ borderColor: drag ? accent : undefined }}
        >
          <div className="text-center px-6">
            <div className="text-5xl mb-3 opacity-70">{busy ? '⏳' : '🚢'}</div>
            <p className="text-white font-medium">{busy ? 'mooring…' : 'drop files here or click to browse'}</p>
            <p className="text-neutral-500 text-sm mt-1">any size · Discord embeds · gentle warnings only</p>
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        </motion.div>

        <AnimatePresence>
          {warn && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 text-amber-300 text-sm text-center">{warn}</motion.p>
          )}
        </AnimatePresence>

        <div className="mt-10 space-y-3">
          <AnimatePresence>
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.035, type: 'spring', stiffness: 240, damping: 20 }}
                className="glass rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{r.name}</p>
                  <code className="text-xs text-neutral-400 truncate block">{r.url}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigator.clipboard.writeText(r.url)} className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs active:scale-95">copy</button>
                  <button onClick={() => navigate('s', r.id)} className="px-3 py-1.5 rounded-full text-white text-xs active:scale-95" style={{ background: accent }}>open</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
