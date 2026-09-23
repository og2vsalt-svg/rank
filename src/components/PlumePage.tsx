import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function PlumePage() {
  const [text, setText] = useState('');
  const [fname, setFname] = useState('note.txt');

  const save = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname || 'note.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const bytes = new TextEncoder().encode(text).length;
  const warn = bytes > 8 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">plume</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">text to file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            write something, name it, keep it. no size lock. huge notes just get a slowness warning.
          </p>
          <input
            value={fname}
            onChange={(e) => setFname(e.target.value)}
            className="w-full mb-3 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="type anything"
            className="w-full mb-4 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y"
          />
          <p className="text-xs text-neutral-500 mb-3">{bytes} bytes</p>
          {warn && <p className="text-amber-300/90 text-xs mb-3">chunky note. download might feel slow on weak devices.</p>}
          <button onClick={save} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
            save file
          </button>
        </motion.div>
      </div>
    </div>
  );
}
