import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function GlacierPage() {
  const [card, setCard] = useState<{ name: string; size: number; type: string; hash: string; when: string } | null>(null);
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('big file. hashing stays local but the tab might nap.');
    else setWarn('');
    const buf = await file.arrayBuffer();
    const hash = await sha256(buf);
    setCard({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', hash, when: new Date().toISOString() });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glacier</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">freeze a fingerprint.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 a local file and keep a snapshot card. nothing leaves the tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">pick any file</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {card && (
            <div className="mt-6 rounded-2xl bg-black/30 p-5 space-y-2">
              <p className="text-white font-medium">{card.name}</p>
              <p className="text-xs text-neutral-500">{pretty(card.size)} · {card.type}</p>
              <p className="text-[11px] text-neutral-400 break-all font-mono">{card.hash}</p>
              <p className="text-[11px] text-neutral-600">{card.when}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
