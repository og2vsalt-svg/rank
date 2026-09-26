import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function Card({ label, meta, err }: { label: string; meta: CloudMeta | null; err: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-5 min-h-[160px]">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</p>
      {err && <p className="text-xs text-red-400">{err}</p>}
      {!err && !meta && <p className="text-xs text-neutral-500">nothing loaded yet</p>}
      {meta && (
        <div className="space-y-1">
          <p className="text-sm text-white truncate">{meta.name}</p>
          <p className="text-xs text-neutral-400">{pretty(meta.size)} · {meta.type || 'file'}</p>
          <p className="text-xs text-neutral-500">{meta.downloads || 0} opens{meta.author ? ' · ' + meta.author : ''}</p>
          <p className="text-[11px] text-[#0a84ff] break-all">{shareUrls(meta.id).embed}</p>
        </div>
      )}
    </div>
  );
}

export default function ValePage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [left, setLeft] = useState<CloudMeta | null>(null);
  const [right, setRight] = useState<CloudMeta | null>(null);
  const [errA, setErrA] = useState('');
  const [errB, setErrB] = useState('');
  const [busy, setBusy] = useState(false);

  const look = async () => {
    setBusy(true);
    setErrA('');
    setErrB('');
    try {
      if (a.trim()) {
        const m = await fetchShare(a.trim());
        setLeft(m);
        if (!m) setErrA('left id is missing or expired');
      } else {
        setLeft(null);
        setErrA('need an id on the left');
      }
      if (b.trim()) {
        const m = await fetchShare(b.trim());
        setRight(m);
        if (!m) setErrB('right id is missing or expired');
      } else {
        setRight(null);
        setErrB('need an id on the right');
      }
    } finally {
      setBusy(false);
    }
  };

  const same = left && right && left.size === right.size && left.name === right.name;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">vale</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two share ids, one look.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a quiet compare of two public drops sitting in the db.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input value={a} onChange={(e) => setA(e.target.value)} placeholder="left share id" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={b} onChange={(e) => setB(e.target.value)} placeholder="right share id" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          </div>
          <button onClick={look} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'looking…' : 'compare'}</button>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <Card label="left" meta={left} err={errA} />
            <Card label="right" meta={right} err={errB} />
          </div>
          {left && right && (
            <p className="text-xs text-neutral-500 mt-4">{same ? 'same name and size. could be twins.' : 'different cards. keep both embeds if you want.'}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
