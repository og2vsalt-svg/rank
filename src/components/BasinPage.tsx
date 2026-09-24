import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function BasinPage() {
  const [text, setText] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) setWarn('big text. counting may hitch. no cap.');
    else setWarn('');
    setText(await file.text());
  };

  const ranks = useMemo(() => {
    const map = new Map<string, number>();
    for (const raw of text.toLowerCase().split(/[^a-z0-9']+/)) {
      if (raw.length < 3) continue;
      map.set(raw, (map.get(raw) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
  }, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">basin</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">word weather from a local text file.</h1>
          <p className="text-neutral-400 text-sm mb-6">frequency only. nothing is stored off-device.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center mb-4 transition">
            <input type="file" accept=".txt,.md,.csv,.log,text/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">drop text</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-40 px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none resize-none mb-5" placeholder="or type" />
          <div className="space-y-2">
            {ranks.map(([w, n]) => (
              <div key={w} className="flex items-center gap-3">
                <p className="w-32 truncate text-sm text-neutral-200">{w}</p>
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full bg-[#0a84ff] rounded-full" style={{ width: `${Math.min(100, (n / (ranks[0]?.[1] || 1)) * 100)}%` }} />
                </div>
                <p className="text-xs text-neutral-500 w-8 text-right">{n}</p>
              </div>
            ))}
            {!ranks.length && <p className="text-sm text-neutral-500">nothing counted yet</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
