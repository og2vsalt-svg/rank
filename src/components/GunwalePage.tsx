import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha256Hex(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function GunwalePage() {
  const [rows, setRows] = useState<{ name: string; size: number; hash: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState(false);

  const run = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setWarn(files.some((f) => f.size > 80 * 1024 * 1024) ? 'hashing big files can stall the tab for a bit. no limit besides your machine.' : '');
    setBusy(true);
    try {
      const next = [];
      for (const f of files) {
        next.push({ name: f.name, size: f.size, hash: await sha256Hex(f) });
      }
      setRows(next);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    const text = rows.map((r) => `${r.hash}  ${r.name}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gunwale</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">fingerprint locals without sending them.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 stays in the browser. handy before you publish a drop and want to prove it later.</p>
          <label className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => run(e.target.files)} />
            {busy ? 'hashing…' : 'choose files'}
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {rows.length > 0 && (
            <div className="mt-6">
              <button onClick={copy} className="mb-3 px-4 py-2 rounded-full bg-white/10 text-sm">{copied ? 'copied' : 'copy checksums'}</button>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.hash + r.name} className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-sm">{r.name} · {pretty(r.size)}</p>
                    <p className="text-[11px] font-mono text-neutral-500 break-all">{r.hash}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
