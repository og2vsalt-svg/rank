import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietIndexPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    listPublicShares(48).then((rows) => {
      setShares(rows);
      setLoading(false);
    });
  }, []);

  const filtered = shares.filter(
    (s) =>
      !query ||
      (s.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.caption || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.author || '').toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        >
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softquietindex</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a quiet index of what has been shared</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Recent public shares appear here as frosted glass cards. Search by name, caption, or author. Open any link for the full share with polished Discord embeds. Large files are never refused — only gently noted if slow. All prior desks remain fully intact.
          </p>
        </motion.div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search the index…"
          className="glass mt-8 w-full rounded-2xl px-4 py-3 text-[14px] outline-none"
        />

        {loading && <p className="mt-8 text-[14px] text-white/40">gathering…</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((s, i) => (
            <motion.a
              key={s.id}
              href={shareUrls(s.id).embed}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
              className="glass block rounded-3xl p-5 hover:bg-white/[0.06] transition"
            >
              <p className="truncate text-[15px] font-medium">{s.name || 'untitled'}</p>
              {s.caption && <p className="mt-1 line-clamp-2 text-[13px] text-white/55">{s.caption}</p>}
              <div className="mt-3 flex items-center justify-between text-[12px] text-white/40">
                <span>{s.author || 'anonymous'}</span>
                <span>{s.size ? `${(s.size / 1024).toFixed(0)} kb` : ''}</span>
              </div>
            </motion.a>
          ))}
        </div>

        {!loading && !filtered.length && (
          <p className="mt-12 text-center text-[14px] text-white/40">nothing matches. the index is quiet.</p>
        )}
      </main>
    </div>
  );
}
