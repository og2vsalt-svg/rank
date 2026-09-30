import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function KilnPage() {
  const [raw, setRaw] = useState('');
  const compact = useMemo(() => raw.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(), [raw]);
  const saved = raw.length - compact.length;
  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">kiln</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">fire extra space out of a note.</h1>
          <p className="text-sm text-neutral-500 mb-6">no upload. just a quieter draft.</p>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8} className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y" placeholder="paste a messy draft" />
          <p className="text-xs text-neutral-500 mb-3">{raw.length} → {compact.length} chars · trimmed {Math.max(0, saved)}</p>
          <pre className="text-sm text-neutral-200 whitespace-pre-wrap break-words min-h-[80px]">{compact || '—'}</pre>
        </motion.div>
      </div>
    </div>
  );
}
