import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function MarrowPage() {
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [chunks, setChunks] = useState<string[]>([]);
  const [size, setSize] = useState(280);

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setWarn(f.size > 8 * 1024 * 1024 ? 'large text. splitting still runs, the tab may hitch. no hard limit.' : '');
    const text = await f.text();
    const out: string[] = [];
    const n = Math.max(40, size);
    for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n));
    setChunks(out.slice(0, 80));
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
          <p className="text-[#0a84ff] text-sm mb-2">marrow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">split a note into small slips.</h1>
          <p className="text-neutral-400 text-sm mb-6">local chunk desk. useful before you paste something into a tight field.</p>
          <div className="flex items-center gap-3 mb-5">
            <label className="text-xs text-neutral-500">chars</label>
            <input
              type="number"
              min={40}
              value={size}
              onChange={(e) => setSize(Number(e.target.value) || 280)}
              className="w-24 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white"
            />
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept=".txt,.md,.csv,.json,.log,text/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{name || 'drop a local text file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {chunks.length > 0 && (
            <ol className="mt-8 space-y-3">
              {chunks.map((c, i) => (
                <li key={i} className="rounded-2xl bg-white/[0.04] border border-white/5 p-3">
                  <p className="text-[11px] text-neutral-500 mb-1">slip {i + 1}</p>
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap break-words">{c}</p>
                </li>
              ))}
            </ol>
          )}
        </motion.div>
      </div>
    </div>
  );
}
