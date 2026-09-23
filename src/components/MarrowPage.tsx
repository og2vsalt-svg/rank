import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hexdump(buf: ArrayBuffer) {
  const b = new Uint8Array(buf);
  const lines: string[] = [];
  for (let i = 0; i < b.length; i += 16) {
    const slice = b.slice(i, i + 16);
    const hex = [...slice].map((x) => x.toString(16).padStart(2, '0')).join(' ');
    const ascii = [...slice].map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : '.')).join('');
    lines.push(`${i.toString(16).padStart(6, '0')}  ${hex.padEnd(47, ' ')}  ${ascii}`);
  }
  return lines.join('\n');
}

export default function MarrowPage() {
  const [dump, setDump] = useState('');
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setWarn(file.size > 80 * 1024 * 1024 ? 'huge file. only peeling the first 512 bytes.' : '');
    const slice = await file.slice(0, 512).arrayBuffer();
    setDump(hexdump(slice));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">marrow</p>
          <h1 className="text-3xl font-semibold mb-3">the first 512 bytes.</h1>
          <p className="text-neutral-400 text-sm mb-6">classic hex + ascii. local only.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">open a file</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {name && <p className="text-sm text-white mb-3">{name}</p>}
          {dump && <pre className="text-[11px] leading-5 text-neutral-400 overflow-x-auto font-mono">{dump}</pre>}
        </motion.div>
      </div>
    </div>
  );
}
