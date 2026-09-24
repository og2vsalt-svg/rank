import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function IsthmusPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [left, setLeft] = useState<CloudMeta | null>(null);
  const [right, setRight] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pull = async () => {
    setBusy(true);
    setErr('');
    try {
      const [x, y] = await Promise.all([fetchShare(a.trim()), fetchShare(b.trim())]);
      setLeft(x);
      setRight(y);
      if (!x || !y) setErr('need two live public share ids. grab them from drop or bazaar.');
    } catch {
      setErr('could not reach the share db');
    } finally {
      setBusy(false);
    }
  };

  const card = (m: CloudMeta | null, label: string) => (
    <div className="glass rounded-3xl p-5 min-h-[160px]">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</p>
      {m ? (
        <>
          <p className="text-white font-medium break-all">{m.name}</p>
          <p className="text-xs text-neutral-500 mt-1">{m.type} · {Math.round((m.size || 0) / 1024)} kb</p>
          <a href={shareUrls(m.id).embed} className="text-xs text-[#0a84ff] mt-3 inline-block">discord link</a>
        </>
      ) : (
        <p className="text-neutral-600 text-sm">empty bank</p>
      )}
    </div>
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">isthmus</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">bridge two public drops.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. just a skinny strip between two share ids so you can eyeball them side by side.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input value={a} onChange={(e) => setA(e.target.value)} placeholder="share id a" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={b} onChange={(e) => setB(e.target.value)} placeholder="share id b" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          </div>
          <button onClick={pull} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium mb-6 disabled:opacity-50">
            {busy ? 'pulling…' : 'connect the banks'}
          </button>
          {err && <p className="text-xs text-amber-300/80 mb-4">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-3">{card(left, 'left bank')}{card(right, 'right bank')}</div>
        </motion.div>
      </div>
    </div>
  );
}
