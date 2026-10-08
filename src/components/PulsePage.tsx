import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

type Row = { id: string; name: string; size?: number; caption?: string | null; created_at?: string };

export default function PulsePage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/keep?list=1').then((r) => r.json()).catch(() => ({ files: [] })),
      fetch('/api/share?list=1').then((r) => r.json()).catch(() => ({ shares: [] })),
    ]).then(([kept, shared]) => {
      const a = Array.isArray(kept.files) ? kept.files : [];
      const b = Array.isArray(shared.shares) ? shared.shares : [];
      const seen = new Set<string>();
      const merged: Row[] = [];
      for (const row of [...a, ...b]) {
        if (!row?.id || seen.has(row.id)) continue;
        seen.add(row.id);
        merged.push(row);
      }
      setRows(merged.slice(0, 24));
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">pulse</motion.p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">what just landed.</h1>
          <p className="text-neutral-400 mb-8">Recent files from the database and the public share table. Paste a link in Discord for the card.</p>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <motion.a
                key={row.id}
                href={`/s/${row.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="block glass rounded-2xl px-4 py-3 hover:bg-white/[0.05] transition"
              >
                <p className="text-sm text-white">{row.name}</p>
                <p className="text-xs text-neutral-500">{row.caption || `${row.size || 0} bytes`} · /s/{row.id}</p>
              </motion.a>
            ))}
            {!rows.length && <p className="text-sm text-neutral-500">quiet for now.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
