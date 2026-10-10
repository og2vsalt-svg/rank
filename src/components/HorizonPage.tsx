import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listShares, prettySize } from '../lib/db';
import { useRouter } from './Router';

type Share = {
  id: string;
  name: string;
  mime: string;
  size: number;
  file_url: string;
  author?: string | null;
  caption?: string | null;
  created_at: string;
};

export default function HorizonPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShares(40)
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-white overflow-hidden">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-5 mb-8">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2"
          >
            horizon
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
          >
            The shared line.
          </motion.h1>
          <p className="text-neutral-400 mt-3 max-w-xl leading-relaxed">
            Recent files from the public shelf, laid out as a quiet cinematic scroll. Tap any card to open the share. Discord embeds stay on every link. No limits, only gentle pace notes elsewhere.
          </p>
        </div>

        {loading ? (
          <div className="px-5 text-neutral-500 text-sm">loading the line…</div>
        ) : shares.length === 0 ? (
          <div className="px-5 text-neutral-500">nothing public yet. drop something on the shelf.</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-5 pb-4 snap-x snap-mandatory scrollbar-thin">
            {shares.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate('s', s.id)}
                className="snap-start shrink-0 w-[280px] sm:w-[320px] rounded-[28px] glass p-4 text-left apple-card hover:bg-white/[0.06] transition"
              >
                <div className="aspect-[4/3] rounded-2xl bg-black/40 mb-3 overflow-hidden grid place-items-center">
                  {s.mime?.startsWith('image/') && s.file_url ? (
                    <img src={s.file_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-neutral-500 text-xs">{s.mime?.split('/')[1] || 'file'}</span>
                  )}
                </div>
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {prettySize(s.size)}{s.author ? ` · ${s.author}` : ''}
                </div>
                {s.caption && (
                  <div className="text-xs text-neutral-400 mt-2 line-clamp-2">{s.caption}</div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
