import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function LumenExplorerPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | 'image' | 'video' | 'audio' | 'other'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const list = await listPublicShares(48);
        if (live) setShares(list);
      } catch (e: any) {
        if (live) setError(e?.message || 'could not load shares');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return shares.filter((sh) => {
      const matchQ = !s || (sh.name || '').toLowerCase().includes(s) || (sh.caption || '').toLowerCase().includes(s);
      if (!matchQ) return false;
      if (type === 'all') return true;
      const mime = (sh.type || '').toLowerCase();
      if (type === 'image') return mime.startsWith('image/');
      if (type === 'video') return mime.startsWith('video/');
      if (type === 'audio') return mime.startsWith('audio/');
      return !mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/');
    });
  }, [shares, q, type]);

  const copyLink = (id: string) => {
    const urls = shareUrls(id);
    navigator.clipboard.writeText(urls.embed);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen explorer</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">browse the living shares.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mx-auto">
            A quiet explorer of recent public shares from the database. Search, filter by type, copy Discord-ready links. Soft size notes only — no hard limits, no boosting. Apple-style springs on frosted glass.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-3xl p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search names or captions…"
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <div className="flex gap-2 flex-wrap justify-center">
            {(['all', 'image', 'video', 'audio', 'other'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  type === t ? 'bg-[#0A84FF] text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>

        {loading && <p className="text-center text-neutral-500">opening the shares…</p>}
        {error && <p className="text-center text-red-400 text-sm">{error}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((sh, i) => (
              <motion.div
                key={sh.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                className="glass rounded-3xl p-5 space-y-3 hover:bg-white/[0.04] transition"
              >
                {sh.type?.startsWith('image/') && sh.url && (
                  <img src={sh.url} alt="" className="w-full h-40 object-cover rounded-2xl" />
                )}
                <h3 className="font-medium truncate">{sh.name || 'untitled'}</h3>
                {sh.caption && <p className="text-sm text-neutral-400 line-clamp-2">{sh.caption}</p>}
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{prettySize(sh.size || 0)}</span>
                  <span>{sh.downloads || 0} views</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(sh.id)}
                    className="flex-1 py-2 rounded-full bg-white/10 text-sm hover:bg-white/20 transition"
                  >
                    copy link
                  </button>
                  <button
                    onClick={() => navigate('share', sh.id)}
                    className="flex-1 py-2 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] text-sm hover:bg-[#0A84FF]/30 transition"
                  >
                    open
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-center text-neutral-500 mt-12">no shares match. try another filter.</p>
        )}

        <button onClick={() => navigate('home')} className="mt-16 text-sm text-neutral-500 hover:text-white transition block mx-auto">
          ← back home
        </button>
      </div>
    </div>
  );
}
