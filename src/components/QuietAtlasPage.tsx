import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuietAtlasPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'other'>('all');

  useEffect(() => {
    (async () => {
      const list = await listPublicShares(36);
      setShares(list);
      setLoading(false);
    })();
  }, []);

  const filtered = shares.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'image') return s.type.startsWith('image/');
    if (filter === 'video') return s.type.startsWith('video/');
    return !s.type.startsWith('image/') && !s.type.startsWith('video/');
  });

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet atlas
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-6"
        >
          A calm map of recent public shares. Spring-animated cards. Click to open. Professional Discord embeds on every link.
        </motion.p>

        <div className="flex gap-2 mb-8">
          {(['all', 'image', 'video', 'other'] as const).map(f => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${filter === f ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'}`}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm">mapping shares…</p>
        ) : filtered.length === 0 ? (
          <p className="text-neutral-500 text-sm">no shares in this view yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 22, delay: i * 0.02 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => navigate('share', s.id)}
                className="glass rounded-2xl p-4 text-left overflow-hidden"
              >
                {s.type.startsWith('image/') && s.url ? (
                  <img src={s.url} alt="" className="w-full h-28 object-cover rounded-xl mb-3" />
                ) : (
                  <div className="w-full h-28 bg-white/5 rounded-xl mb-3 grid place-items-center text-xs text-neutral-500">
                    {s.type.split('/')[0] || 'file'}
                  </div>
                )}
                <div className="text-sm font-medium truncate">{s.name || 'untitled'}</div>
                <div className="text-xs text-neutral-500 mt-1 truncate">{s.caption || s.author || 'public share'}</div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
