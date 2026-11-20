import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, CloudMeta } from '../lib/cloudShare';

export default function EchoPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(36).then(setShares).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10 text-center"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">Echo</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">Recent shares</h1>
          <p className="text-neutral-400 text-base max-w-md mx-auto">A quiet view of public drops. Soft size warnings only. Polished Discord embeds on every link.</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-neutral-500">opening…</div>
        ) : shares.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-neutral-400">No public shares yet. Drop one from Core.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-2xl p-5 block hover:bg-white/[0.03] transition"
              >
                <div className="text-sm font-medium truncate mb-1">{s.name || 'Untitled'}</div>
                <div className="text-xs text-neutral-500">{s.caption || s.type}</div>
                <div className="text-[11px] text-neutral-600 mt-2">{(s.size / 1024 / 1024).toFixed(1)} MB</div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
