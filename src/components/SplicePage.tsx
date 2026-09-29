import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function SplicePage() {
  const [a, setA] = useState<{ name: string; text: string } | null>(null);
  const [b, setB] = useState<{ name: string; text: string } | null>(null);
  const [warn, setWarn] = useState('');

  const take = async (which: 'a' | 'b', file?: File) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) setWarn('large splice. the join stays local and may hitch. no hard limit.');
    const text = await file.text();
    const row = { name: file.name, text };
    if (which === 'a') setA(row);
    else setB(row);
  };

  const joined = a && b ? `${a.text}${a.text.endsWith('\n') ? '' : '\n'}${b.text}` : '';

  const download = () => {
    if (!joined) return;
    const blob = new Blob([joined], { type: 'text/plain' });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = 'splice.txt';
    el.click();
    URL.revokeObjectURL(el.href);
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
          <p className="text-[#0a84ff] text-sm mb-2">splice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">join two texts end to end.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a local splice bench. not a vault. drop two notes and take one file home.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['a', 'b'] as const).map((side) => (
              <label key={side} className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition">
                <input type="file" accept="text/*,.txt,.md,.csv" className="hidden" onChange={(e) => take(side, e.target.files?.[0])} />
                <p className="text-white font-medium">{side === 'a' ? a?.name || 'first file' : b?.name || 'second file'}</p>
              </label>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-3">no file limit. just a slowness ping if it is huge.</p>
          {warn && <p className="text-amber-300/90 text-xs mt-2">{warn}</p>}
          {joined && (
            <button onClick={download} className="mt-6 px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">
              download splice
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
