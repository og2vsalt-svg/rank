import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const KEY = 'rankvault-quorum';

type Row = { id: string; label: string; n: number };

export default function QuorumPage() {
  const [q, setQ] = useState('which drop should we keep?');
  const [rows, setRows] = useState<Row[]>([
    { id: 'a', label: 'keep local', n: 0 },
    { id: 'b', label: 'share the card', n: 0 },
  ]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.q) setQ(parsed.q);
      if (Array.isArray(parsed.rows)) setRows(parsed.rows);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ q, rows }));
    } catch {}
  }, [q, rows]);

  const total = rows.reduce((s, r) => s + r.n, 0);

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
          <p className="text-[#0a84ff] text-sm mb-2">quorum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet poll that never leaves the room.</h1>
          <p className="text-neutral-400 text-sm mb-6">tap to count. stored on this device only.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-5"
          />
          <div className="space-y-3">
            {rows.map((r) => {
              const pct = total ? Math.round((r.n / total) * 100) : 0;
              return (
                <button
                  key={r.id}
                  onClick={() => setRows(rows.map((x) => (x.id === r.id ? { ...x, n: x.n + 1 } : x)))}
                  className="w-full text-left rounded-2xl border border-white/10 bg-black/20 overflow-hidden"
                >
                  <div className="relative px-4 py-3">
                    <div className="absolute inset-0 bg-[#0a84ff]/15" style={{ width: pct + '%' }} />
                    <div className="relative flex items-center justify-between text-sm">
                      <span className="text-neutral-200">{r.label}</span>
                      <span className="text-neutral-500">{r.n} · {pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="add a choice"
              className="flex-1 rounded-2xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none"
            />
            <button
              onClick={() => {
                if (!draft.trim()) return;
                setRows([...rows, { id: Date.now().toString(36), label: draft.trim(), n: 0 }]);
                setDraft('');
              }}
              className="px-4 py-2.5 rounded-full bg-white text-black text-sm font-medium"
            >
              add
            </button>
          </div>
          <button onClick={() => setRows(rows.map((r) => ({ ...r, n: 0 })))} className="mt-4 text-xs text-neutral-500 hover:text-white">
            reset counts
          </button>
        </motion.div>
      </div>
    </div>
  );
}
