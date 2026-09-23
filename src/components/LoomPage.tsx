import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Clip = { id: string; name: string; size: number; note: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function LoomPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [warn, setWarn] = useState('');

  const total = useMemo(() => clips.reduce((a, c) => a + c.size, 0), [clips]);

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Clip[] = [...clips];
    let heavy = false;
    for (const f of Array.from(list)) {
      if (f.size > 40 * 1024 * 1024) heavy = true;
      next.push({ id: crypto.randomUUID(), name: f.name, size: f.size, note: '' });
    }
    setWarn(heavy ? 'one of these is chunky. packing later might feel slow. no cap tho.' : '');
    setClips(next);
  };

  const exportList = async () => {
    const text = clips.map((c, i) => `${i + 1}. ${c.name} (${pretty(c.size)})${c.note ? ' — ' + c.note : ''}`).join('\n');
    const blob = new Blob([`loom pack\n${clips.length} files · ${pretty(total)}\n\n${text}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'loom-pack.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">loom</p>
          <h1 className="text-3xl font-semibold mb-3">queue a pack without dumping it in the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">order files, scribble a note, export a packing list. not another file locker.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">add files to the loom</p>
            <p className="text-xs text-neutral-500 mt-2">names only stay in this tab unless you export.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <p className="text-xs text-neutral-500 mb-3">{clips.length} in queue · {pretty(total)}</p>
          <div className="space-y-2 mb-6">
            {clips.map((c, i) => (
              <div key={c.id} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white truncate">{i + 1}. {c.name}</p>
                  <span className="text-[11px] text-neutral-500 shrink-0">{pretty(c.size)}</span>
                </div>
                <input
                  value={c.note}
                  onChange={(e) => setClips(clips.map((x) => x.id === c.id ? { ...x, note: e.target.value } : x))}
                  placeholder="optional note"
                  className="mt-2 w-full bg-transparent text-xs text-neutral-400 outline-none"
                />
              </div>
            ))}
          </div>
          <button onClick={exportList} disabled={!clips.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">download packing list</button>
        </motion.div>
      </div>
    </div>
  );
}
