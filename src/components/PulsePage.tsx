import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare } from '../lib/cloudShare';

export default function PulsePage() {
  const [id, setId] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const ping = async () => {
    const raw = id.trim().replace(/^.*[?#]f=/, '').replace(/^.*\//, '');
    if (!raw) return;
    setBusy(true);
    setMsg('');
    try {
      const meta = await fetchShare(raw);
      if (!meta) {
        setOk(false);
        setMsg('no live share on that id. maybe expired or still private.');
      } else {
        setOk(true);
        setMsg(`${meta.name} · ${(meta.size / 1024).toFixed(1)} kb · ${meta.type}`);
      }
    } catch (e: any) {
      setOk(false);
      setMsg(e?.message || 'could not reach host');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pulse</p>
          <h1 className="text-3xl font-semibold mb-3">is this drop still breathing</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id or full link. we only read the public db row.</p>
          <div className="flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="id or /s/abc" className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-sm outline-none" />
            <button onClick={ping} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'checking' : 'pulse'}</button>
          </div>
          {msg && (
            <p className={`mt-5 text-sm ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>{msg}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
