import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function LumenGalleryPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await listPublicShares(48);
      setShares(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[#64D2FF] text-sm font-medium tracking-wide mb-3">lumen gallery</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            recent light from the desks.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            A quiet gallery of recent public shares. Browse what others have dropped into the database. Every link unfurls a polished Discord card. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-neutral-500 text-sm">gathering light…</p>
        ) : shares.length === 0 ? (
          <p className="text-neutral-500">no public shares yet. drop something on any desk.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => navigate('s', s.id)}
                className="text-left rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.07] transition overflow-hidden"
              >
                {s.type.startsWith('image/') && s.url && !s.url.startsWith('data:') && (
                  <img src={s.url} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
                )}
                <p className="font-medium text-sm truncate">{s.name || 'untitled'}</p>
                {s.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                <p className="text-[10px] text-neutral-500 mt-2">{(s.size / 1024 / 1024).toFixed(1)} MB · {s.author || 'anonymous'}</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
