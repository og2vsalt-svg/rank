import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function GalleryPage() {
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(32).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">gallery</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.035em]">recent public shares</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
            A quiet gallery of files already shared. Open any card to view or download. No new uploads here — this is for browsing what others have left. Human-crafted Apple-style glass and spring motion. Discord embeds on every link. Prior features preserved.
          </p>
        </motion.div>

        {loading && <p className="mt-10 text-sm text-white/40">gathering…</p>}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const isImage = item.type.startsWith('image/');
            return (
              <motion.a
                key={item.id}
                href={`/s/${item.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 16 }}
                className="glass group block overflow-hidden rounded-3xl p-4 transition-all hover:bg-white/[0.06]"
              >
                {isImage && item.fileUrl ? (
                  <div className="mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-black/20">
                    <img src={item.fileUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-2xl bg-white/[0.03] text-[12px] text-white/30">
                    {item.type.split('/')[0] || 'file'}
                  </div>
                )}
                <p className="truncate text-[14px] font-medium">{item.name || item.id}</p>
                <p className="mt-1 truncate text-[12px] text-white/40">{item.caption || 'no note'}</p>
                <p className="mt-2 text-[11px] text-white/25">{(item.size / 1024).toFixed(0)} kb · {item.author || 'anonymous'}</p>
              </motion.a>
            );
          })}
        </div>

        {!loading && !items.length && (
          <p className="mt-10 text-sm text-white/40">nothing public yet. share something from another desk.</p>
        )}
      </main>
    </div>
  );
}
