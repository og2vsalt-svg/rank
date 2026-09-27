import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function TracePage() {
  const vault = useVault();
  const files = (vault as any).files || (vault as any).items || [];
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = Array.isArray(files) ? files : [];
    return list
      .filter((f: any) => !q || String(f.name || f.id || '').toLowerCase().includes(q.toLowerCase()))
      .slice(0, 80);
  }, [files, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8 mb-5">
          <p className="text-[#0a84ff] text-sm mb-2">trace</p>
          <h1 className="text-3xl font-semibold mb-3">what is already in the vault, at a glance.</h1>
          <p className="text-neutral-400 text-sm mb-6">read-only map. no extra upload. if a file is huge you will already have seen the slowness warning.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-white/5 rounded-full px-4 py-2.5 text-sm outline-none" placeholder="filter by name" />
        </motion.div>
        <div className="space-y-2">
          {rows.map((f: any) => (
            <div key={f.id || f.name} className="glass rounded-2xl px-4 py-3 flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{f.name || 'untitled'}</p>
                <p className="text-[11px] text-neutral-500 truncate">{f.id} · {f.public ? 'public' : 'private'}</p>
              </div>
              <p className="text-xs text-neutral-500 shrink-0">{f.size ? Math.round(f.size / 1024) + ' kb' : ''}</p>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-neutral-500">vault looks empty from here. drop something first.</p>}
        </div>
      </div>
    </div>
  );
}
