import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function QuarryPage() {
  const [info, setInfo] = useState<{ name: string; size: number; type: string; hex: string; text: string } | null>(null);
  const [warn, setWarn] = useState('');

  const peek = async (file?: File) => {
    if (!file) return;
    setWarn(file.size > 80 * 1024 * 1024 ? 'huge local file. we only read the first slice so the tab stays chill.' : '');
    const slice = file.slice(0, 4096);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const hex = [...bytes.slice(0, 64)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '.');
    setInfo({ name: file.name, size: file.size, type: file.type || 'unknown', hex, text });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quarry</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek local bytes. no upload.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault and not a share. just the first slice of a file so you know what you are about to drop.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => peek(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a file to inspect</p>
            <p className="text-xs text-neutral-500 mt-2">stays on device. no cap, first 4kb only.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {info && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-white">{info.name}</p>
              <p className="text-xs text-neutral-500">{pretty(info.size)} · {info.type}</p>
              <p className="text-[11px] font-mono text-neutral-400 break-all">{info.hex}</p>
              <pre className="text-[11px] text-neutral-500 whitespace-pre-wrap break-all max-h-48 overflow-auto">{info.text}</pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
