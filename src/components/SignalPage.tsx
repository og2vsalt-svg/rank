import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare } from '../lib/cloudShare';

type Ping = { id: string; at: string; name: string; ok: boolean; note: string };

export default function SignalPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Ping[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rv-signal') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rv-signal', JSON.stringify(log.slice(0, 80)));
  }, [log]);

  const ping = async () => {
    const clean = id.trim();
    if (!clean) return;
    setBusy(true);
    const meta = await fetchShare(clean);
    setLog((prev) => [
      {
        id: clean,
        at: new Date().toISOString(),
        name: meta?.name || 'missing',
        ok: !!meta,
        note: meta ? `${meta.type} · ${meta.size}b` : 'not live or expired',
      },
      ...prev,
    ]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">signal</p>
          <h1 className="text-3xl font-semibold mb-3">tap a drop and see if it still breathes.</h1>
          <p className="text-neutral-400 text-sm mb-6">health check for public shares. no file cap, just a lag note if you spam it.</p>
          <div className="flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-sm outline-none" placeholder="share id" />
            <button onClick={ping} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'ping…' : 'ping'}</button>
          </div>
        </motion.div>
        <div className="mt-5 space-y-2">
          {log.map((p, i) => (
            <div key={p.at + i} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm">{p.name}</p>
                <p className="text-[11px] text-neutral-500">{p.id} · {p.note}</p>
              </div>
              <span className={`text-xs ${p.ok ? 'text-emerald-400' : 'text-amber-300'}`}>{p.ok ? 'live' : 'quiet'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
