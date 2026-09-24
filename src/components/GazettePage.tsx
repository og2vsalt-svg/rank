import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function GazettePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(36);
      if (!cancelled) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">gazette</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops, live from the db.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. just the latest files people flipped public. paste the embed url in discord and it unfurls clean.</p>
          {loading && <p className="text-sm text-neutral-500">listening…</p>}
          {!loading && rows.length === 0 && <p className="text-sm text-neutral-500">quiet out here. drop something on portage first.</p>}
          <ul className="grid sm:grid-cols-2 gap-3">
            {rows.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-3xl p-5"
              >
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {pretty(r.size)} · {(r.type || 'file').split(';')[0]}
                  {r.author ? ' · ' + r.author : ''}
                </p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate('share', r.id)} className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-medium">open</button>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(r.id).embed)}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 text-xs"
                  >
                    copy embed
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
