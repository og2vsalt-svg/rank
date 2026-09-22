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

export default function MeridianPage() {
  const [info, setInfo] = useState<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
    hash: string;
    warn?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hash = await sha256(buf);
      const warn =
        file.size > 40 * 1024 * 1024
          ? 'this file is large. hashing finished, but previews and public drops may feel sleepy. no hard cap.'
          : undefined;
      setInfo({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        lastModified: file.lastModified,
        hash,
        warn,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meridian</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">fingerprint a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this device. sha-256 plus size and type. not a vault clone.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <span className="text-sm text-neutral-300">{busy ? 'hashing…' : 'drop or pick a file'}</span>
          </label>
          {info && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white font-medium break-all">{info.name}</p>
              <p className="text-neutral-400">{formatBytes(info.size)} · {info.type}</p>
              <p className="text-neutral-500 text-xs">modified {new Date(info.lastModified).toLocaleString()}</p>
              <p className="text-neutral-300 text-xs break-all font-mono bg-black/30 rounded-2xl p-3">{info.hash}</p>
              {info.warn && <p className="text-amber-300/80 text-xs">{info.warn}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
