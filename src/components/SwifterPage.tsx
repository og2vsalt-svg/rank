import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Drop = {
  id: string;
  name: string;
  mime?: string | null;
  size?: number;
  note?: string | null;
  author?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SwifterPage() {
  const { shareId, navigate } = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [open, setOpen] = useState<Drop | null>(null);
  const [status, setStatus] = useState('recent files that actually live in the database.');

  useEffect(() => {
    fetch('/api/forefoot?list=1')
      .then((r) => r.json())
      .then((data) => setDrops(Array.isArray(data.drops) ? data.drops : []))
      .catch(() => setStatus('could not read the forefoot table'));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/forefoot?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'not found');
        setOpen(data.drop);
        setStatus('paste this page in Discord. the card uses the file name and size.');
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'could not open that drop'));
  }, [shareId]);

  const fileHref = open ? `/api/forefoot?id=${encodeURIComponent(open.id)}&download=1` : '';
  const image = open?.mime?.startsWith('image/');

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.16em] uppercase text-white/45">
          swifter
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.045em]">
          Open what forefoot stored.
        </motion.h1>
        <p className="mt-4 text-[17px] text-white/60 max-w-xl">A reading desk, not another vault. Pick a drop, preview it, hand someone the link.</p>

        {open && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">{open.author || 'forefoot'}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{open.name}</h2>
            <p className="mt-1 text-sm text-white/50">{pretty(Number(open.size) || 0)}{open.note ? ` · ${open.note}` : ''}</p>
            {image && fileHref && (
              <img src={fileHref} alt="" className="mt-4 max-h-80 rounded-2xl border border-white/10 object-contain bg-black/40" />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={fileHref} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition-transform">download</a>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/swifter/${open.id}`)}
                className="px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15 transition-colors"
              >
                copy discord link
              </button>
            </div>
          </motion.section>
        )}

        <div className="mt-8 space-y-2">
          {drops.map((row) => (
            <button
              key={row.id}
              onClick={() => navigate('swifter', row.id)}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.07] transition-colors"
            >
              <p className="text-sm">{row.name}</p>
              <p className="text-xs text-white/40 mt-1">{row.author || 'forefoot'} · {pretty(Number(row.size) || 0)}</p>
            </button>
          ))}
          {!drops.length && <p className="text-sm text-white/40">nothing stored yet. forefoot writes the first one.</p>}
        </div>
        <p className="mt-4 text-sm text-white/45">{status}</p>
      </main>
    </div>
  );
}
