import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function ValePage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [type, setType] = useState('');
  const [hash, setHash] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setName(file.name);
    setSize(file.size);
    setType(file.type || 'unknown');
    setWarn(file.size > 40 * 1024 * 1024 ? 'big file. hashing can feel slow on this device. no hard cap.' : '');
    try {
      const buf = await file.arrayBuffer();
      setHash(await sha256(buf));
    } catch {
      setHash('could not hash this file in-browser');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">vale</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a file without keeping it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. drop something local, get size, type, and a sha-256. nothing leaves this tab.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">{busy ? 'reading…' : 'drop a file or tap to pick'}</p>
          </label>
          {name && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white">{name}</p>
              <p className="text-neutral-500">{formatBytes(size)} · {type}</p>
              {warn && <p className="text-amber-400/80 text-xs">{warn}</p>}
              <p className="text-neutral-400 break-all font-mono text-xs pt-2">{hash || '…'}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
