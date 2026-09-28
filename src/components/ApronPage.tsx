import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const KEY = 'rankvault-apron';

export default function ApronPage() {
  const [note, setNote] = useState('');

  useEffect(() => {
    try {
      setNote(localStorage.getItem(KEY) || '');
    } catch {}
  }, []);

  const save = (v: string) => {
    setNote(v);
    try { localStorage.setItem(KEY, v); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">apron</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a scratch desk that never leaves the tab.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault and not a share. just a local pad for names, hashes, and half thoughts.
          </p>
          <textarea
            value={note}
            onChange={(e) => save(e.target.value)}
            rows={12}
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-neutral-200 outline-none focus:border-[#0a84ff]/50 transition"
            placeholder="leave a mark…"
          />
          <p className="text-xs text-neutral-500 mt-3">{note.length} chars · saved on this device</p>
        </motion.div>
      </div>
    </div>
  );
}
