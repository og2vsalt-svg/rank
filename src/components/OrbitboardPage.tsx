import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls } from '../lib/cloudShare';

type Share = {
  id: string;
  name?: string;
  caption?: string | null;
  size?: number;
  downloads?: number;
  color?: string | null;
};

export default function OrbitboardPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(16).then((rows) => setShares(rows as Share[])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12 relative">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 105, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">orbitboard</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">recent shares in quiet orbit</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            A living board of the latest public drops. Each orb is a share that landed in the database. Hover to lift, click to open. Every link still carries a polished Discord embed. Soft spring motion, frosted glass, no hard limits. All prior desks remain.
          </p>
        </motion.div>

        {loading ? (
          <div className="mt-16 text-center text-sm text-white/40">gathering the orbit…</div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={shareUrls(s.id).app}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 16 }}
                whileHover={{ scale: 1.04, y: -4 }}
                className="glass flex aspect-square flex-col justify-between rounded-[28px] p-4 apple-card"
                style={{ boxShadow: s.color ? `0 12px 40px -18px ${s.color}66` : undefined }}
              >
                <div>
                  <p className="truncate text-[13px] font-medium text-white/90">{s.name || 'untitled'}</p>
                  <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-white/50">{s.caption || 'shared quietly'}</p>
                </div>
                <p className="text-[11px] text-white/35">
                  {s.size ? `${(s.size / 1024).toFixed(0)} kb` : 'note'} · {s.downloads || 0} arrivals
                </p>
              </motion.a>
            ))}
          </div>
        )}

        {!loading && shares.length === 0 && (
          <p className="mt-12 text-center text-sm text-white/40">no public shares yet — drop something from any desk.</p>
        )}
      </main>
    </div>
  );
}
