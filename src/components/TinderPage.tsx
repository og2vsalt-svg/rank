import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Row = { word: string; n: number };

function tally(text: string): Row[] {
  const map = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
  for (const w of words) map.set(w, (map.get(w) || 0) + 1);
  return [...map.entries()]
    .map(([word, n]) => ({ word, n }))
    .sort((a, b) => b.n - a.n || a.word.localeCompare(b.word))
    .slice(0, 40);
}

export default function TinderPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setWarn(f.size > 8 * 1024 * 1024 ? 'large text. counting still runs, the tab may hitch. no hard limit.' : '');
    const text = await f.text();
    setRows(tally(text));
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
          <p className="text-[#0a84ff] text-sm mb-2">tinder</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">count the words, keep the file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local frequency desk. drop a note or transcript. nothing leaves this tab.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept=".txt,.md,.csv,.json,.log,text/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{name || 'drop a local text file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-8 space-y-2">
              {rows.map((r) => (
                <li key={r.word} className="flex items-center justify-between text-sm">
                  <span className="text-white tracking-tight">{r.word}</span>
                  <span className="text-neutral-500 tabular-nums">{r.n}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
