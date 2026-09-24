import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function ChapelPage() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(20);
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) setWarn('long manuscript. the reader may lag. no cap.');
    else setWarn('');
    setText(await file.text());
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">chapel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a local file like a page.</h1>
          <p className="text-neutral-400 text-sm mb-6">quiet type. no sharing. just the words.</p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="cursor-pointer px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm">
              <input type="file" accept=".txt,.md,text/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              open file
            </label>
            <input type="range" min={16} max={32} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <article
            className="glass rounded-[32px] p-8 min-h-[24rem] text-neutral-200 leading-[1.7] whitespace-pre-wrap"
            style={{ fontSize: size }}
          >
            {text || 'open a text file to begin.'}
          </article>
        </motion.div>
      </div>
    </div>
  );
}
