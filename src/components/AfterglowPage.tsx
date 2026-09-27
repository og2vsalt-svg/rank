import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function AfterglowPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    listPublicShares(36)
      .then(setRows)
      .finally(() => setBusy(false));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">afterglow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops still warm.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just the latest files that landed in the share db.</p>
          {busy && <p className="text-sm text-neutral-500">listening…</p>}
          {!busy && !rows.length && <p className="text-sm text-neutral-500">quiet out here.</p>}
          <div className="space-y-2">
            {rows.map((r, i) => {
              const urls = shareUrls(r.id);
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate('share', r.id)}
                  className="w-full text-left rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 px-4 py-3 transition"
                >
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {pretty(r.size)} · {r.type || 'file'} {r.author ? `· ${r.author}` : ''}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-1 truncate">{urls.embed}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
