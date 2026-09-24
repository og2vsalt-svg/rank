import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function NookPage() {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState('');
  const [copied, setCopied] = useState(false);

  const persist = () => {
    const v = note.trim();
    if (!v) return;
    setSaved(v);
    try { localStorage.setItem('rank-nook', v); } catch {}
  };

  const copy = async () => {
    const v = saved || note;
    if (!v) return;
    try { await navigator.clipboard.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nook</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet clipboard locker.</h1>
          <p className="text-neutral-400 text-sm mb-6">stash a snippet on this device. not a vault. just a little pocket for text you keep losing.</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={8} placeholder="paste anything…" className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition" />
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={persist} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">keep on device</button>
            <button onClick={copy} className="px-5 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition">{copied ? 'copied' : 'copy out'}</button>
          </div>
          {saved && <p className="text-xs text-neutral-500 mt-5 break-words">held: {saved.slice(0, 240)}{saved.length > 240 ? '…' : ''}</p>}
        </motion.div>
      </div>
    </div>
  );
}
