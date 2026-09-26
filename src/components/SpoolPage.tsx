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

export default function SpoolPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let live = true;
    listPublicShares(40).then((list) => {
      if (live) {
        setRows(list);
        setBusy(false);
      }
    });
    return () => { live = false; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">spool</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops, newest first.</h1>
          <p className="text-neutral-400 text-sm mb-8">a feed off the same db the share api writes to. not your private vault.</p>
          {busy && <p className="text-sm text-neutral-500">unspooling…</p>}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate('share', r.id)}
                className="w-full text-left glass rounded-[22px] px-5 py-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 shrink-0">{pretty(r.size)}</p>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 truncate">{shareUrls(r.id).embed}</p>
              </motion.button>
            ))}
          </div>
          {!busy && rows.length === 0 && <p className="text-sm text-neutral-500">nothing public yet. drop something first.</p>}
        </motion.div>
      </div>
    </div>
  );
}
