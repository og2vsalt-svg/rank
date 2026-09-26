import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function FoyerPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    listPublicShares(36)
      .then(setRows)
      .catch(() => setErr('could not read the public table'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">foyer</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops in the hall.</h1>
          <p className="text-neutral-400 text-sm mb-8">live rows from the share db. tap a card to open the share desk. discord still prefers /s/id.</p>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <button key={r.id} onClick={() => navigate('share', r.id)} className="text-left glass rounded-3xl p-5 hover:-translate-y-0.5 transition">
                  <p className="text-white font-medium truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{r.type} · {pretty(r.size)}</p>
                  <p className="text-[11px] text-neutral-600 mt-2 break-all">{urls.embed}</p>
                </button>
              );
            })}
          </div>
          {!rows.length && !err && <p className="text-sm text-neutral-500">quiet hall. nobody dropped yet.</p>}
        </motion.div>
      </div>
    </div>
  );
}
