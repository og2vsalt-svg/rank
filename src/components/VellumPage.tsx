import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function VellumPage() {
  const [text, setText] = useState('');
  const [name, setName] = useState('note.txt');
  const [warn, setWarn] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) setWarn('chunky text file. the editor may lag. no cap.');
    else setWarn('');
    setName(file.name);
    setText(await file.text());
  };

  const lines = text ? text.split(/\n/).length : 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name || 'vellum.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">vellum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">open a local text file and mark it up.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on device. not a vault slot. drop a txt or just type.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center mb-4 transition">
            <input type="file" accept=".txt,.md,.json,.csv,.log,text/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">drop a text file</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-72 px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none resize-none font-mono leading-relaxed" />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-neutral-500">{lines} lines · {words} words · {text.length} chars</p>
            <button onClick={download} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save copy</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
