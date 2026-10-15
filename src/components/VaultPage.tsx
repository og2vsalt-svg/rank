import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls } from '../lib/cloudShare';

export default function VaultPage() {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(18).then(setShares).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 mb-8"
        >
          <p className="text-sm text-[#0A84FF] mb-2 tracking-wide">vault</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">the quiet center of your shares.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Recent public drops from every desk. Each link carries a polished Discord embed. Files live in the database. No hard limits — only gentle warnings for large drops. All prior desks remain.
          </p>
        </motion.div>
        {loading ? (
          <div className="text-center text-neutral-500 text-sm">gathering…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={shareUrls(s.id).app}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-3xl p-5 block hover:bg-white/[0.07] transition-all duration-500 apple-card"
              >
                <p className="text-xs text-neutral-500 mb-1 truncate">{s.name || 'untitled'}</p>
                <p className="text-sm text-neutral-300 line-clamp-2 mb-3">{s.caption || 'shared quietly'}</p>
                <p className="text-[11px] text-neutral-600">{(s.size / 1024 / 1024).toFixed(1)} MB · {s.downloads || 0} arrivals</p>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
