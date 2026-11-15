import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listShares } from '../lib/db';

export default function QuietBeaconPage() {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShares(16).then(setShares).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1 text-[#FF9F0A]">Quiet Beacon</p>
          <h1 className="text-[36px] font-semibold tracking-tight mb-3">Recent activity.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            A still view of the latest public shares. Soft spring-entry frosted cards. Professional Discord embeds on every link. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>

          {loading ? (
            <p className="text-neutral-500">Listening…</p>
          ) : (
            <div className="space-y-3">
              {shares.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={`/s/${s.id}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition"
                >
                  <div className="w-2 h-2 rounded-full bg-[#FF9F0A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name || 'untitled share'}</p>
                    <p className="text-xs text-neutral-500 truncate">{s.caption || 'no caption'}</p>
                  </div>
                  <span className="text-[11px] text-neutral-500 shrink-0">{s.download_count || 0}</span>
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
