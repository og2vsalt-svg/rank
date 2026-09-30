import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function GlyphPage() {
  const [name, setName] = useState('');
  const clean = useMemo(() => name.normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 180), [name]);
  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glyph</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">make a filename travel well.</h1>
          <p className="text-sm text-neutral-500 mb-6">strips odd glyphs so a drop link does not look broken in discord.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="messy file name.mp4" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-4" />
          <p className="text-sm text-white break-all">{clean || '—'}</p>
        </motion.div>
      </div>
    </div>
  );
}
