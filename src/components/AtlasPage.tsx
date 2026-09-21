import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function AtlasPage() {
  const vault = useVault() as any;
  const files: any[] = vault?.files || vault?.items || [];
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = Array.isArray(files) ? files : [];
    return list.filter((f) => {
      const name = String(f?.name || f?.filename || '');
      return name.toLowerCase().includes(q.toLowerCase());
    });
  }, [files, q]);

  const groups = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((f) => {
      const mime = String(f?.type || f?.mime || 'unknown');
      const key = mime.split('/')[0] || 'unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map);
  }, [rows]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">atlas</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">map what is already in the vault</h1>
          <p className="text-sm text-neutral-500 mb-6">not another vault. just a quiet index of files already on this device.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name"
            className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none mb-5"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {groups.length === 0 && <p className="text-sm text-neutral-500">nothing parked yet. drop files in vault first.</p>}
            {groups.map(([k, n]) => (
              <span key={k} className="px-3 py-1 rounded-full bg-white/5 text-xs text-neutral-300">
                {k} · {n}
              </span>
            ))}
          </div>
          <ul className="space-y-2">
            {rows.slice(0, 40).map((f, i) => (
              <li key={f.id || i} className="flex justify-between gap-3 text-sm border-b border-white/5 pb-2">
                <span className="truncate text-neutral-200">{f.name || f.filename || 'untitled'}</span>
                <span className="text-neutral-500 shrink-0">{formatBytes(Number(f.size) || 0)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
