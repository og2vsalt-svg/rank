import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function PrismPulsePage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listPublicShares(36);
    setShares(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">prism pulse</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">living pulse of shares.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">A quiet gallery of recent public drops. Soft size notes only. Every link ships with a polished Discord embed. Apple-style springs on frosted glass.</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-neutral-500">gathering…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {shares.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 80, damping: 16, delay: i * 0.03 }}
                  className="glass rounded-3xl p-6 space-y-3 apple-card"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                    <span className="text-xs text-neutral-500">{Math.round((s.size || 0) / 1024)} KB</span>
                  </div>
                  {s.caption && <p className="text-xs text-neutral-400 line-clamp-2">{s.caption}</p>}
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(s.id).embed)}
                    className="w-full py-2 rounded-full bg-white/10 text-xs hover:bg-white/15 transition"
                  >
                    copy link
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
