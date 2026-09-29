import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Stats = { words: number; chars: number; lines: number; minutes: number };

function measure(text: string): Stats {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    words,
    chars: text.length,
    lines: text.split(/\n/).length,
    minutes: Math.max(1, Math.round(words / 220)) || 0,
  };
}

export default function WickPage() {
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setWarn(f.size > 8 * 1024 * 1024 ? 'large text. reading still runs, the tab may hitch. no hard limit.' : '');
    setStats(measure(await f.text()));
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
          <p className="text-[#0a84ff] text-sm mb-2">wick</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how long would this take to read.</h1>
          <p className="text-neutral-400 text-sm mb-6">local reading desk. drop a note. nothing is uploaded.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept=".txt,.md,.csv,.json,.log,text/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{name || 'drop a local text file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {stats && (
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ['words', stats.words],
                ['characters', stats.chars],
                ['lines', stats.lines],
                ['minutes', stats.minutes],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-3">
                  <p className="text-[11px] text-neutral-500">{k}</p>
                  <p className="text-xl text-white tabular-nums tracking-tight">{v}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
