import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} mb`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} gb`;
}

export default function QuarryPage() {
  const { files } = useVault();
  const [q, setQ] = useState('');
  const [warn, setWarn] = useState('');

  const stats = useMemo(() => {
    const total = files.reduce((s, f) => s + (Number(f.size) || 0), 0);
    const kinds: Record<string, number> = {};
    files.forEach((f) => {
      const k = (f.type || 'unknown').split('/')[0] || 'unknown';
      kinds[k] = (kinds[k] || 0) + 1;
    });
    return { total, kinds, count: files.length };
  }, [files]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return files.filter((f) => !s || f.name.toLowerCase().includes(s) || (f.type || '').toLowerCase().includes(s));
  }, [files, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">quarry</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">inventory of what you already dropped.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a second vault. just a quiet census. huge dumps stay allowed — we only whisper if the browser might get sleepy.</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { k: 'files', v: String(stats.count) },
              { k: 'weight', v: pretty(stats.total) },
              { k: 'kinds', v: String(Object.keys(stats.kinds).length) },
            ].map((c) => (
              <div key={c.k} className="rounded-3xl bg-white/[0.04] border border-white/8 px-4 py-4">
                <p className="text-[11px] text-neutral-500 mb-1">{c.k}</p>
                <p className="text-lg font-medium tracking-tight">{c.v}</p>
              </div>
            ))}
          </div>

          {stats.total > 40 * 1024 * 1024 && (
            <p className="text-xs text-amber-300/80 mb-4">this pile is chunky. previews can feel slow on older phones. nothing is blocked.</p>
          )}

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value.length > 80) setWarn('long filter strings are fine, just a tad laggy.');
              else setWarn('');
            }}
            placeholder="filter by name or type"
            className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 transition-colors"
          />
          {warn && <p className="text-xs text-neutral-500 mb-3">{warn}</p>}

          <div className="space-y-1.5">
            {filtered.length === 0 && <p className="text-sm text-neutral-500">nothing in the vault yet. drop files first.</p>}
            {filtered.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{f.name}</p>
                  <p className="text-[11px] text-neutral-500">{f.type || 'file'} · {pretty(Number(f.size) || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
