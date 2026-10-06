import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { listShares } from '../lib/db';
import { useRouter } from './Router';

type Row = {
  id: string;
  name: string;
  mime?: string;
  size?: number;
  caption?: string | null;
  author?: string | null;
  created_at?: string;
};

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClewPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('loading pins…');

  useEffect(() => {
    let live = true;
    listShares(40)
      .then((data: Row[]) => {
        if (!live) return;
        const pins = (data || []).filter((row) => {
          const author = (row.author || '').toLowerCase();
          const caption = (row.caption || '').toLowerCase();
          return author === 'holdfast' || caption.includes('holdfast');
        });
        setRows(pins);
        setStatus(pins.length ? '' : 'no holdfast pins yet. the older shares stay on their own desks.');
      })
      .catch(() => {
        if (live) setStatus('could not read the share table.');
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">index</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">clew</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Open pins already stored from holdfast. This is not a vault drawer. Discord unfurls /clew.
          </p>
        </motion.div>
        {status && <p className="mt-8 text-sm text-white/45">{status}</p>}
        <div className="mt-6 space-y-2">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              onClick={() => navigate('holdfast', row.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <span>
                <span className="block text-sm text-white">{row.name}</span>
                <span className="mt-0.5 block text-[12px] text-white/40">{row.caption || 'pinned file'}</span>
              </span>
              <span className="text-[12px] text-white/35">{pretty(Number(row.size) || 0)}</span>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
