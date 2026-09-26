import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function kind(m: CloudMeta) {
  const t = (m.type || '').toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t.includes('pdf') || t.includes('text') || t.includes('json')) return 'text';
  return 'other';
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SievePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    listPublicShares(80).then((r) => {
      setRows(r);
      setBusy(false);
    });
  }, []);

  const shown = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== 'all' && kind(r) !== filter) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, filter]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sieve</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sift public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a filter over whatever is already live in the share db.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name contains…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'image', 'video', 'audio', 'text', 'other'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] transition ${filter === k ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
              >
                {k}
              </button>
            ))}
          </div>
          {busy && <p className="text-neutral-500 text-sm">listening…</p>}
          {!busy && shown.length === 0 && <p className="text-neutral-500 text-sm">nothing matches yet.</p>}
          <div className="space-y-2">
            {shown.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500">{kind(r)} · {pretty(r.size)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate('share', r.id)} className="text-[12px] px-3 py-1.5 rounded-full bg-white text-black">open</button>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(r.id).embed)}
                    className="text-[12px] px-3 py-1.5 rounded-full bg-white/8 text-neutral-300"
                  >
                    /s card
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
