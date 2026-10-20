import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls } from '../lib/cloudShare';

export default function QuietLedgerPage() {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'size' | 'name'>('recent');

  useEffect(() => {
    listPublicShares(48).then(setShares).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = shares;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.caption || '').toLowerCase().includes(q) ||
          (s.author || '').toLowerCase().includes(q)
      );
    }
    if (sort === 'size') list = [...list].sort((a, b) => (b.size || 0) - (a.size || 0));
    else if (sort === 'name') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [shares, query, sort]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-7 mb-6"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#0A84FF] mb-2">quietledger</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet record of what has been shared</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Browse recent public shares from every desk. Soft glass cards, spring motion. Each link carries a polished Discord embed. Files live in the database. No hard limits — only gentle warnings elsewhere. Different from a plain vault drawer. Prior features preserved.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search name, note, or author…"
            className="glass flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="glass rounded-2xl px-4 py-3 text-sm outline-none bg-transparent"
          >
            <option value="recent">recent</option>
            <option value="size">largest</option>
            <option value="name">name</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-neutral-500 text-sm py-12">gathering the ledger…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm py-12">nothing matches yet.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <motion.a
                key={s.id}
                href={shareUrls(s.id).app}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', stiffness: 140, damping: 18 }}
                className="glass rounded-2xl p-4 flex items-center justify-between gap-4 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">{s.caption || 'shared quietly'}</p>
                </div>
                <div className="text-right shrink-0 text-xs text-neutral-500">
                  <p>{(s.size / 1024 / 1024).toFixed(1)} MB</p>
                  <p>{s.downloads || 0} arrivals</p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
