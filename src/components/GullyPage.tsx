import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function GullyPage() {
  const [parts, setParts] = useState<{ name: string; url: string; size: number }[]>([]);
  const [warn, setWarn] = useState('');
  const [chunk, setChunk] = useState(2);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('big split. browser might feel sleepy. still no hard cap.');
    else setWarn('');
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const n = Math.max(2, Math.min(12, chunk));
    const size = Math.ceil(bytes.length / n);
    const next: { name: string; url: string; size: number }[] = [];
    for (let i = 0; i < n; i++) {
      const slice = bytes.slice(i * size, (i + 1) * size);
      if (!slice.length) continue;
      const blob = new Blob([slice], { type: 'application/octet-stream' });
      next.push({ name: `${file.name}.part${i + 1}`, url: URL.createObjectURL(blob), size: slice.length });
    }
    setParts(next);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gully</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">split a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">carve a file into parts you can stash separately. reassemble later however you want.</p>
          <label className="flex items-center gap-3 text-sm text-neutral-400 mb-4">
            parts
            <input type="number" min={2} max={12} value={chunk} onChange={(e) => setChunk(Number(e.target.value) || 2)} className="w-20 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 outline-none text-white" />
          </label>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a file to split</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {parts.length > 0 && (
            <div className="mt-6 space-y-2">
              {parts.map((p) => (
                <a key={p.name} href={p.url} download={p.name} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm hover:bg-white/8">
                  <span className="text-white truncate">{p.name}</span>
                  <span className="text-neutral-500 text-xs">{p.size} b</span>
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
