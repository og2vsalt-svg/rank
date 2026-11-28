import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkPulsePage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(20).then(setShares).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">silk pulse</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a living pulse of shares.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Recent public drops settle into a soft pulse. Each link is Discord-ready. Soft size notes only — no hard limits, no boosting. Apple-style springs on frosted glass.
          </p>
        </motion.div>

        {loading && <p className="mt-12 text-neutral-500">feeling the pulse…</p>}

        <div className="mt-12 space-y-4">
          {shares.map((sh, i) => (
            <motion.div
              key={sh.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 100, damping: 18 }}
              className="glass rounded-2xl p-5 flex items-center justify-between text-left"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{sh.name || 'untitled'}</p>
                <p className="text-xs text-neutral-500">{sh.caption?.slice(0, 60) || 'no caption'}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrls(sh.id).embed)}
                className="ml-4 text-[#0A84FF] text-sm hover:underline shrink-0"
              >
                copy
              </button>
            </motion.div>
          ))}
        </div>

        {!loading && shares.length === 0 && <p className="mt-12 text-neutral-500">the pulse is quiet for now.</p>}

        <button onClick={() => navigate('home')} className="mt-16 text-sm text-neutral-500 hover:text-white transition">
          ← back home
        </button>
      </div>
    </div>
  );
}
