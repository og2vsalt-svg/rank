import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function LedgerPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let live = true;
    listPublicShares(48).then((list) => {
      if (live) {
        setRows(list);
        setBusy(false);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const shown = rows.filter((r) => {
    const hay = (r.name + ' ' + r.type + ' ' + (r.author || '')).toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ledger</p>
          <h1 className="text-3xl font-semibold mb-3">recent public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">pulled from the cloud table. not a vault dump — just the stuff people flipped public.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name or type"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          {busy && <p className="text-sm text-neutral-500">loading ledger…</p>}
          {!busy && shown.length === 0 && <p className="text-sm text-neutral-500">nothing public right now.</p>}
          <div className="space-y-2">
            {shown.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate('share', r.id)}
                className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/12 px-4 py-3 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <span className="text-[11px] text-neutral-500 shrink-0">{pretty(r.size)}</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 truncate">{r.type} · {shareUrls(r.id).embed}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
