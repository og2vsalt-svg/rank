import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls } from '../lib/cloudShare';
import type { CloudMeta } from '../lib/cloudShare';

export default function PublicgalleryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    listPublicShares(48).then((rows) => {
      setShares(rows);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(''), 1400);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">publicgallery</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">recent public shares</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            A quiet look at files recently shared into the public_shares table. Different from the local vault — these live in the database and storage. Spring motion, glass surfaces, polished Discord embeds on every link. Large files warned only. Prior desks remain fully functional. No traces of boosting.
          </p>
        </motion.div>

        {loading && <p className="mt-8 text-sm text-white/40">loading recent shares…</p>}
        {!loading && shares.length === 0 && <p className="mt-8 text-sm text-white/40">no public shares yet.</p>}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {shares.map((s) => {
            const embed = shareUrls(s.id).embed;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4"
              >
                <p className="truncate text-[15px] font-medium">{s.name || 'untitled'}</p>
                <p className="mt-1 text-[12px] text-white/40">{(s.size / 1024).toFixed(0)} kb · {s.downloads || 0} arrivals</p>
                {s.caption && <p className="mt-2 text-[13px] text-white/60 line-clamp-2">{s.caption}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => copy(embed)}
                    className="rounded-full bg-white/10 px-3 py-1 text-[12px] hover:bg-white/15"
                  >
                    {copied === embed ? 'copied' : 'copy link'}
                  </button>
                  <a href={embed} className="text-[12px] text-white/50 hover:text-white/80">open</a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
