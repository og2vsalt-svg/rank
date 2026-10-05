import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function Pane({ label, meta }: { label: string; meta: CloudMeta | null }) {
  if (!meta) {
    return (
      <div className="glass rounded-[28px] p-6 min-h-64 text-neutral-500 text-sm grid place-items-center">
        {label} is empty
      </div>
    );
  }
  const image = meta.type.startsWith('image/') && /^https?:\/\//.test(meta.url);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-[28px] p-5 lift"
    >
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 mb-2">{label}</p>
      <h2 className="text-lg font-medium tracking-tight mb-1">{meta.cardTitle || meta.name}</h2>
      <p className="text-xs text-neutral-500 mb-3">{pretty(meta.size)} · {meta.type || 'file'}</p>
      {image ? (
        <img src={meta.url} alt="" className="rounded-2xl w-full max-h-72 object-cover bg-black/40" />
      ) : (
        <a href={meta.url} className="text-sm text-[#64d2ff]">open file</a>
      )}
      {meta.caption && <p className="text-sm text-neutral-300 mt-3 whitespace-pre-wrap">{meta.caption}</p>}
    </motion.article>
  );
}

export default function LoomPage() {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [left, setLeft] = useState<CloudMeta | null>(null);
  const [right, setRight] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pull = async () => {
    setBusy(true);
    setErr('');
    try {
      const [a, b] = await Promise.all([
        leftId.trim() ? fetchShare(leftId.trim()) : Promise.resolve(null),
        rightId.trim() ? fetchShare(rightId.trim()) : Promise.resolve(null),
      ]);
      if (leftId.trim() && !a) setErr('left share was not found, or it expired');
      if (rightId.trim() && !b) setErr((prev) => prev || 'right share was not found, or it expired');
      setLeft(a);
      setRight(b);
    } catch (e: any) {
      setErr(e?.message || 'could not read shares');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#bf5af2] text-sm mb-2">loom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">lay two shares side by side.</h1>
          <p className="text-neutral-400 text-sm mb-6 max-w-2xl">
            Paste two public share ids. This is a reading bench, not a vault. Nothing is copied, capped, or refused.
          </p>
          <div className="glass rounded-[28px] p-5 mb-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input value={leftId} onChange={(e) => setLeftId(e.target.value)} placeholder="left share id" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none" />
            <input value={rightId} onChange={(e) => setRightId(e.target.value)} placeholder="right share id" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none" />
            <button type="button" onClick={pull} disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50">
              {busy ? 'reading…' : 'lay them out'}
            </button>
          </div>
          {err && <p className="text-xs text-amber-200 mb-4">{err}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <Pane label="left" meta={left} />
            <Pane label="right" meta={right} />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
