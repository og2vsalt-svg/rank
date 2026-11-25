import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenGalleryPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(36).then((rows) => {
      setShares(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="mb-10 text-center"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Lumen Gallery</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">Recent shares</h1>
          <p className="text-neutral-400 text-[15.5px] max-w-xl mx-auto">
            A quiet public gallery of recent drops. Soft hover lifts. Click any card for the full share with Discord embed.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-neutral-500 text-sm">opening…</div>
        ) : shares.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm">No public shares yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shares.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 20 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('share', s.id)}
                className="glass rounded-3xl overflow-hidden text-left border border-white/5 hover:border-white/15 transition"
              >
                {s.type?.startsWith('image/') && s.fileUrl ? (
                  <img src={s.fileUrl} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-black/30 grid place-items-center text-neutral-500 text-xs">
                    {s.name?.slice(0, 24) || 'file'}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-medium text-white truncate">{s.cardTitle || s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1 truncate">{s.caption || 'shared file'}</p>
                  <p className="text-[11px] text-neutral-600 mt-2">{shareUrls(s.id).app.split('/').pop()}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
