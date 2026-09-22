import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function NestPage() {
  const { files } = useVault() as any;
  const [q, setQ] = useState('');

  const trees = useMemo(() => {
    const buckets: Record<string, any[]> = {};
    (files || []).forEach((f: any) => {
      const ext = (f.name || '').split('.').pop()?.toLowerCase() || 'other';
      (buckets[ext] ||= []).push(f);
    });
    return Object.entries(buckets)
      .map(([k, v]) => ({ k, v: v.filter((f: any) => !q || String(f.name).toLowerCase().includes(q.toLowerCase())) }))
      .filter((b) => b.v.length);
  }, [files, q]);

  const heavy = (files || []).some((f: any) => (f.size || 0) > 80 * 1024 * 1024);

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
          <p className="text-[#0a84ff] text-sm mb-2">nest</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stack by extension.</h1>
          <p className="text-neutral-400 text-sm mb-6">a different view of the vault pile. no extra limits. just nests.</p>
          {heavy && <p className="text-xs text-amber-300/80 mb-4">some files are chunky. this list is still just metadata.</p>}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter names"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          {trees.length === 0 && <p className="text-sm text-neutral-500">empty nest. drop something in vault first.</p>}
          <div className="space-y-3">
            {trees.map((t) => (
              <div key={t.k} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-white text-sm mb-2">.{t.k} · {t.v.length}</p>
                {t.v.slice(0, 12).map((f: any) => (
                  <p key={f.id} className="text-xs text-neutral-400 truncate">{f.name}</p>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
