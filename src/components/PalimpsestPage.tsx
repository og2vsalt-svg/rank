import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Layer = { id: string; at: number; text: string };

export default function PalimpsestPage() {
  const [text, setText] = useState('');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [warn, setWarn] = useState('');

  const snapshot = () => {
    const size = new Blob([text]).size;
    setWarn(size > 1.5 * 1024 * 1024 ? 'fat draft. snapshots stay local, no cap, just might feel sticky.' : '');
    setLayers((prev) => [{ id: crypto.randomUUID().slice(0, 6), at: Date.now(), text }, ...prev].slice(0, 24));
  };

  const currentWords = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] text-[#0a84ff] mb-3">palimpsest</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">draft layers. nothing uploaded.</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">a writing desk next to the vault. snapshots live in this tab so you can peel back a version without touching file hosting.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full bg-white/[0.04] border border-white/8 rounded-3xl px-5 py-4 text-sm outline-none resize-y leading-relaxed" placeholder="write. snapshot. rewrite." />
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-neutral-500">{currentWords} words · local only</p>
            <button onClick={snapshot} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">take layer</button>
          </div>
          {warn && <p className="text-xs text-amber-300 mt-2">{warn}</p>}
          <div className="mt-8 grid gap-3">
            {layers.map((l) => (
              <button key={l.id} onClick={() => setText(l.text)} className="text-left rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 hover:bg-white/[0.05] transition-colors">
                <p className="text-xs text-neutral-500 mb-1">{new Date(l.at).toLocaleTimeString()} · {l.text.trim().split(/\s+/).filter(Boolean).length} words</p>
                <p className="text-sm text-neutral-300 line-clamp-3">{l.text || '(empty layer)'}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
