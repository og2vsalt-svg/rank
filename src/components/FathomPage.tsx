import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function FathomPage() {
  const [name, setName] = useState('');
  const [meta, setMeta] = useState<{ size: number; type: string; entropy: number; zeros: number; lines?: number } | null>(null);
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'big file — only sampling the first 2mb so this tab stays snappy.' : '');
    const slice = await file.slice(0, 2 * 1024 * 1024).arrayBuffer();
    const bytes = new Uint8Array(slice);
    const hist = new Array(256).fill(0);
    let zeros = 0;
    for (const b of bytes) {
      hist[b]++;
      if (b === 0) zeros++;
    }
    let entropy = 0;
    const n = bytes.length || 1;
    for (const c of hist) {
      if (!c) continue;
      const p = c / n;
      entropy -= p * Math.log2(p);
    }
    let lines: number | undefined;
    if (file.type.startsWith('text/') || /\.(txt|md|json|csv|ts|js|css|html)$/i.test(file.name)) {
      const text = new TextDecoder().decode(bytes);
      lines = text.split(/\r?\n/).length;
    }
    setMeta({ size: file.size, type: file.type || 'application/octet-stream', entropy: Math.round(entropy * 100) / 100, zeros, lines });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">fathom</p>
          <h1 className="text-3xl font-semibold mb-3">how deep is this file.</h1>
          <p className="text-neutral-400 text-sm mb-6">entropy, zero bytes, line count for text. stays local. no upload.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition mb-6">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a file to measure</p>
            <p className="text-xs text-neutral-500 mt-2">no cap. we sample the front of huge files.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {name && meta && (
            <div className="space-y-2 text-sm">
              <p className="text-white">{name}</p>
              <p className="text-neutral-400">{pretty(meta.size)} · {meta.type}</p>
              <p className="text-neutral-300">entropy {meta.entropy} / 8</p>
              <p className="text-neutral-500">zeros in sample {meta.zeros}</p>
              {meta.lines != null && <p className="text-neutral-500">~{meta.lines} lines in sample</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
