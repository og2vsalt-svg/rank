import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function RelicPage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [type, setType] = useState('');
  const [sha, setSha] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setSize(file.size);
    setType(file.type || 'application/octet-stream');
    setSha('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'big file. hashing stays in this tab so it can feel slow. no cap.' : '');
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
      setSha(hex);
    } catch (e: any) {
      setWarn(e?.message || 'could not hash');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">relic</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">fingerprint a local file</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on your machine. sha-256 only. not a vault upload.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'hashing…' : 'drop a file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {name && (
            <div className="mt-6 space-y-1 text-sm text-neutral-300">
              <p>{name}</p>
              <p className="text-neutral-500 text-xs">{type} · {pretty(size)}</p>
              {sha && <p className="font-mono text-xs break-all text-neutral-400 pt-2">{sha}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
