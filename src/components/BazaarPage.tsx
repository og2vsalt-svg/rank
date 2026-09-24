import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function kindOf(t: string) {
  const m = (t || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('text/') || m.includes('json')) return 'text';
  return 'file';
}

export default function BazaarPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(60);
      if (!cancelled) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (kind !== 'all' && kindOf(r.type) !== kind) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, kind]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">bazaar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public files, filterable.</h1>
          <p className="text-sm text-neutral-400 mb-6">gazette is a feed. this is a stall. search and clip discord embeds without opening the vault.</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search a name" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <div className="flex gap-1 overflow-x-auto">
              {['all', 'image', 'video', 'audio', 'text', 'file'].map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`px-3.5 py-2 rounded-full text-xs ${kind === k ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'}`}>{k}</button>
              ))}
            </div>
          </div>
          {loading && <p className="text-sm text-neutral-500">pulling stalls…</p>}
          {!loading && filtered.length === 0 && <p className="text-sm text-neutral-500">empty aisle.</p>}
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li key={r.id} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500">{kindOf(r.type)} · {pretty(r.size)}</p>
                </div>
                <button onClick={() => navigate('share', r.id)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">open</button>
                <button onClick={() => navigator.clipboard.writeText(shareUrls(r.id).embed)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">embed</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
