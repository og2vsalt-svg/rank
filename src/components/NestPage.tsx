import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function NestPage() {
  const { files, ready } = useVault();
  const [picked, setPicked] = useState<string[]>([]);
  const selected = useMemo(() => files.filter((f) => picked.includes(f.id)), [files, picked]);
  const bytes = selected.reduce((n, f) => n + f.size, 0);

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const pack = () => {
    const payload = {
      kind: 'rankvault-nest',
      packedAt: new Date().toISOString(),
      files: selected.map((f) => ({ name: f.name, type: f.type, size: f.size, dataUrl: f.dataUrl, note: f.note })),
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nest-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nest</p>
          <h1 className="text-3xl font-semibold mb-3">pack vault files into one nest.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a share. just a local bundle you can download and import later.</p>
          {!ready && <p className="text-sm text-neutral-500">loading vault…</p>}
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {files.slice(0, 80).map((f) => (
              <button key={f.id} onClick={() => toggle(f.id)} className={`w-full text-left px-4 py-3 rounded-2xl text-sm ${picked.includes(f.id) ? 'bg-[#0a84ff]/15 text-white' : 'bg-white/5 text-neutral-300'}`}>
                {f.name}
              </button>
            ))}
            {!files.length && ready && <p className="text-sm text-neutral-500">vault empty. drop something first.</p>}
          </div>
          <p className="text-xs text-neutral-500 mt-4">{selected.length} picked · {(bytes / 1024 / 1024).toFixed(1)} mb{bytes > 40 * 1024 * 1024 ? ' · packing this will feel slow' : ''}</p>
          <button disabled={!selected.length} onClick={pack} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">download nest</button>
        </motion.div>
      </div>
    </div>
  );
}
