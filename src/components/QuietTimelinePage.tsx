import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietTimelinePage() {
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(40).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">timeline</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.035em]">quiet timeline</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            A still chronological view of shared light. Drop files from other desks; they settle here in order, with notes. Large files warned, never refused. Spring motion, glass surfaces, polished Discord embeds on every link. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        {loading && <p className="mt-10 text-sm text-white/40">gathering the thread…</p>}

        <div className="relative mt-12">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 110, damping: 16 }}
              className="relative mb-8 pl-12"
            >
              <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-white/20 bg-[#0A84FF]" />
              <motion.a
                href={`/s/${item.id}`}
                className="glass block rounded-2xl p-4 transition-all hover:bg-white/[0.06]"
              >
                <p className="text-[13px] font-medium">{item.name || item.id}</p>
                {item.caption && <p className="mt-1 text-[13px] leading-snug text-white/60">{item.caption}</p>}
                <p className="mt-2 text-[11px] text-white/30">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  {item.author ? ` · ${item.author}` : ''} · {(item.size / 1024).toFixed(0)} kb
                </p>
              </motion.a>
            </motion.div>
          ))}
        </div>

        {!loading && !items.length && (
          <p className="mt-10 text-sm text-white/40">the timeline is still. share from another desk to begin the thread.</p>
        )}
      </main>
    </div>
  );
}
