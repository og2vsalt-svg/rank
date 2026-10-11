import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

export default function LumenPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useRouter();

  useEffect(() => {
    listPublicShares(36).then((rows) => {
      setShares(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">lumen</p>
          <h1 className="text-4xl font-semibold tracking-tight">public light</h1>
          <p className="text-neutral-400 mt-2 max-w-lg">recent shares from the database. each link carries a professional Discord embed. no size limits — only quiet warnings when things get heavy.</p>
        </motion.div>

        {loading ? (
          <div className="grid place-items-center py-20 text-neutral-500">gathering light…</div>
        ) : shares.length === 0 ? (
          <p className="text-neutral-500 text-center py-16">no public shares yet. drop one from the vault or drop page.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                className="apple-card glass rounded-3xl p-5 overflow-hidden group"
              >
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-40 object-cover rounded-2xl mb-4" />
                ) : (
                  <div className="h-40 rounded-2xl bg-white/5 mb-4 grid place-items-center text-neutral-500 text-sm">
                    {s.type?.split('/')[1] || 'file'}
                  </div>
                )}
                <h2 className="font-medium truncate">{s.name || 'untitled'}</h2>
                <p className="text-xs text-neutral-500 mt-1">{pretty(s.size)} · {s.caption || 'no caption'}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => navigate('share', s.id)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">open</button>
                  <button
                    onClick={async () => {
                      const urls = shareUrls(s.id);
                      try { await navigator.clipboard.writeText(urls.app); } catch {}
                    }}
                    className="px-4 py-2 rounded-full bg-white/10 text-xs"
                  >copy link</button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
