import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function Card({ label, meta }: { label: string; meta: CloudMeta | null }) {
  if (!meta) return <div className="glass rounded-3xl p-6 text-sm text-neutral-500">{label}: nothing loaded</div>;
  const urls = shareUrls(meta.id);
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-[#0a84ff] text-xs mb-2">{label}</p>
      <h2 className="text-lg font-medium mb-2 break-all">{meta.name}</h2>
      <p className="text-sm text-neutral-400">{formatBytes(meta.size)} · {meta.type}</p>
      <p className="text-xs text-neutral-500 mt-2">{meta.downloads || 0} opens · {meta.author || 'unsigned'}</p>
      <p className="text-xs text-neutral-600 mt-3 break-all">{urls.embed}</p>
    </div>
  );
}

export default function MarinerPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [left, setLeft] = useState<CloudMeta | null>(null);
  const [right, setRight] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const clean = (v: string) => v.replace(/^.*(?:f=|\/s\/|\/f\/)/, '').replace(/[^a-z0-9_-]/gi, '');

  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      const [x, y] = await Promise.all([fetchShare(clean(a)), fetchShare(clean(b))]);
      setLeft(x);
      setRight(y);
      if (!x && !y) setErr('neither id resolved on the share db.');
    } catch {
      setErr('could not reach the share db.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[#0a84ff] text-sm mb-2">mariner</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two live shares, side by side.</h1>
          <p className="text-neutral-400 text-sm max-w-xl">lookup only. no bytes opened unless you click an embed. useful when you forgot which drop is which.</p>
        </motion.div>
        <div className="glass rounded-[28px] p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input value={a} onChange={(e) => setA(e.target.value)} placeholder="share id or /s/…" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={b} onChange={(e) => setB(e.target.value)} placeholder="second id" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          </div>
          <button onClick={run} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'looking…' : 'compare'}</button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card label="port" meta={left} />
          <Card label="starboard" meta={right} />
        </div>
      </div>
    </div>
  );
}
