import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const KEY = 'rankvault.sanctum.v1';

export default function SanctumPage() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    try {
      setText(localStorage.getItem(KEY) || '');
    } catch {}
  }, []);

  const persist = () => {
    try {
      localStorage.setItem(KEY, text);
      setSaved('kept on this device');
    } catch {
      setSaved('could not write locally');
    }
  };

  const wipe = () => {
    setText('');
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setSaved('cleared');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">sanctum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a private desk. never uploaded.</h1>
          <p className="text-neutral-400 text-sm mb-6">journal stays in local storage. not the cloud db. not the vault.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-80 px-4 py-3 rounded-[28px] bg-white/5 border border-white/10 text-sm outline-none resize-none leading-relaxed"
            placeholder="write something you do not want shared"
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-neutral-500">{text.length} chars · {saved || 'unsaved'}</p>
            <div className="flex gap-2">
              <button onClick={wipe} className="px-4 py-2 rounded-full bg-white/5 text-sm text-neutral-300">clear</button>
              <button onClick={persist} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">keep here</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
