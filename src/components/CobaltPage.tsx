import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hexDump(buf: ArrayBuffer, max = 1024) {
  const bytes = new Uint8Array(buf.slice(0, max));
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.slice(i, i + 16);
    const hex = Array.from(slice).map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(slice).map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
    lines.push(`${i.toString(16).padStart(6, '0')}  ${hex.padEnd(47, ' ')}  ${ascii}`);
  }
  return lines.join('\n');
}

export default function CobaltPage() {
  const [dump, setDump] = useState('');
  const [meta, setMeta] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) setWarn('heavy binary. we only peek the first kb so the tab stays alive. no cap on the file itself.');
    const buf = await f.slice(0, 2048).arrayBuffer();
    setMeta(`${f.name} \u00b7 ${f.type || 'unknown'} \u00b7 ${(f.size / 1024).toFixed(1)} kb`);
    setDump(hexDump(buf));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">cobalt</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek the bytes.</h1>
          <p className="text-neutral-400 text-sm mb-6">hex viewer for a local file. first kilobyte only. never leaves the tab.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-8 text-center mb-4 hover:border-[#0a84ff]/40 transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            drop any file
          </label>
          {meta && <p className="text-xs text-neutral-500 mb-2">{meta}</p>}
          {dump && <pre className="text-[11px] leading-5 font-mono text-neutral-300 overflow-auto bg-black/40 rounded-2xl p-4">{dump}</pre>}
        </motion.div>
      </div>
    </div>
  );
}
