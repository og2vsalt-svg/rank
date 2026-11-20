import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function LumenRipplePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(10).then((rows) => {
      setShares(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight mb-3"
        >
          lumen ripple
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-10 max-w-md mx-auto">
          Soft glowing rings around recent shares. Apple-style springs. Discord embeds ready. Soft warnings only. All prior desks intact.
        </p>
        {loading ? (
          <p className="text-neutral-500">...</p>
        ) : (
          <div className="relative h-96 grid place-items-center">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                className="absolute glass rounded-full w-24 h-24 grid place-items-center text-xs"
                style={{ left: `calc(50% + ${Math.cos(i * 0.7) * (40 + i * 18)}px)`, top: `calc(50% + ${Math.sin(i * 0.7) * (40 + i * 18)}px)` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring' }}
                whileHover={{ scale: 1.1 }}
              >
                {s.name?.slice(0, 8) || 'drop'}
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
