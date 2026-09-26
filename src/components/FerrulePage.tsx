import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function prettySize(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function hex(buf: Uint8Array, n = 32) {
  return Array.from(buf.slice(0, n)).map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

export default function FerrulePage() {
  const [info, setInfo] = useState<{
    name: string;
    type: string;
    size: number;
    head: string;
    sha: string;
    warn?: string;
  } | null>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    const warn = file.size > 32 * 1024 * 1024 ? 'big file. hashing the head only so the tab stays chill. no cap, just a warning.' : undefined;
    const slice = file.slice(0, Math.min(file.size, 2 * 1024 * 1024));
    const buf = new Uint8Array(await slice.arrayBuffer());
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const sha = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    setInfo({
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      head: hex(buf, 48),
      sha,
      warn,
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
          <p className="text-[#0a84ff] text-sm mb-2">ferrule</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek the metal at the tip of a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local only. first bytes + sha of the first couple megs. not a vault shelf.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
            <span className="text-sm text-neutral-300">drop or pick a file</span>
          </label>
          {info && (
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 space-y-2">
              <p className="text-white font-medium truncate">{info.name}</p>
              <p className="text-xs text-neutral-500">{info.type} · {prettySize(info.size)}</p>
              <p className="text-[11px] font-mono text-neutral-400 break-all">head {info.head}</p>
              <p className="text-[11px] font-mono text-neutral-500 break-all">sha256(head) {info.sha}</p>
              {info.warn && <p className="text-xs text-amber-300/80">{info.warn}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
