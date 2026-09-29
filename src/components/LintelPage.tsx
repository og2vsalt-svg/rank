import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Meta = { name: string; type: string; size: string; last: string; hex: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function LintelPage() {
  const [warn, setWarn] = useState('');
  const [meta, setMeta] = useState<Meta | null>(null);

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 40 * 1024 * 1024 ? 'large file. we only peek at the first bytes. no hard limit.' : '');
    const slice = await f.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(slice);
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    setMeta({
      name: f.name,
      type: f.type || 'unknown',
      size: pretty(f.size),
      last: f.lastModified ? new Date(f.lastModified).toISOString() : '—',
      hex,
    });
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
          <p className="text-[#0a84ff] text-sm mb-2">lintel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek at a file without opening it.</h1>
          <p className="text-neutral-400 text-sm mb-6">name, type, size, first sixteen bytes. stays on this machine.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{meta?.name || 'drop any local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {meta && (
            <dl className="mt-8 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">type</dt><dd className="text-white">{meta.type}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">size</dt><dd className="text-white tabular-nums">{meta.size}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">modified</dt><dd className="text-white tabular-nums text-right">{meta.last}</dd></div>
              <div>
                <dt className="text-neutral-500 mb-1">header</dt>
                <dd className="text-white font-mono text-xs break-all">{meta.hex}</dd>
              </div>
            </dl>
          )}
        </motion.div>
      </div>
    </div>
  );
}
