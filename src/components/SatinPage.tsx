import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const PRESETS = [
  { name: 'graphite', bg: '#111113', ink: '#f5f5f7', accent: '#0a84ff' },
  { name: 'fog', bg: '#e8e8ed', ink: '#1d1d1f', accent: '#0071e3' },
  { name: 'onyx', bg: '#050506', ink: '#fafafa', accent: '#64d2ff' },
  { name: 'sand', bg: '#f3ece2', ink: '#3a2f24', accent: '#c9a227' },
];

export default function SatinPage() {
  const [name, setName] = useState('untitled drop');
  const [note, setNote] = useState('quiet file. open when ready.');
  const [idx, setIdx] = useState(0);
  const p = PRESETS[idx];

  const css = useMemo(
    () =>
      `:root{--bg:${p.bg};--ink:${p.ink};--accent:${p.accent}}\n.card{background:var(--bg);color:var(--ink);border-radius:28px;padding:28px;font-family:Inter,system-ui}`,
    [p],
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">satin</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">dress a share card</h1>
          <p className="text-neutral-400 text-sm mb-8">preview how a drop could look when someone peeks the link. no file cap, just polish.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none min-h-[100px]" />
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((x, i) => (
                  <button key={x.name} onClick={() => setIdx(i)} className={`px-3.5 py-1.5 rounded-full text-xs ${i === idx ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>{x.name}</button>
                ))}
              </div>
            </div>
            <motion.div layout className="rounded-[28px] p-7 min-h-[220px]" style={{ background: p.bg, color: p.ink }}>
              <p className="text-xs opacity-60 mb-3">rankvault</p>
              <h2 className="text-2xl font-semibold tracking-tight">{name || 'untitled'}</h2>
              <p className="mt-3 text-sm opacity-70">{note}</p>
              <span className="inline-block mt-6 text-xs px-3 py-1 rounded-full" style={{ background: p.accent, color: '#fff' }}>open drop</span>
            </motion.div>
          </div>
          <pre className="mt-6 text-[11px] text-neutral-500 overflow-x-auto">{css}</pre>
        </motion.div>
      </div>
    </div>
  );
}
