import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listShares, prettySize } from '../lib/db';
import { useRouter } from './Router';

type Share = {
  id: string;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  author: string | null;
  caption: string | null;
  created_at: string;
};

export default function TympanumPage() {
  const { shareId, navigate } = useRouter();
  const [rows, setRows] = useState<Share[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    listShares(18)
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .catch(() => setErr('the share table did not answer'));
  }, []);

  const focus = shareId ? rows.find((r) => r.id === shareId) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-[#bf5af2]">tympanum</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">the face of what was already filed</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Not a drawer. This is the public face of files already in the share table. Open one, or paste /tympanum in Discord for a card.</p>
        {err && <p className="mt-4 text-sm text-amber-200/90">{err}</p>}
        {focus && (
          <motion.a href={focus.file_url} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 block glass rounded-3xl p-5">
            <span className="text-xs text-neutral-500">opened from a card</span>
            <span className="mt-1 block text-lg">{focus.caption || focus.name}</span>
            <span className="mt-1 block text-sm text-neutral-400">{prettySize(focus.size)}</span>
          </motion.a>
        )}
        <div className="mt-8 columns-1 sm:columns-2 lg:columns-3 gap-4">
          {rows.map((row, i) => {
            const image = String(row.mime || '').startsWith('image/');
            return (
              <motion.button
                key={row.id}
                onClick={() => navigate('tympanum', row.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4 w-full break-inside-avoid text-left glass rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform duration-300"
              >
                {image && <img src={row.file_url} alt="" className="w-full max-h-56 object-cover" />}
                <div className="p-4">
                  <p className="text-sm truncate">{row.caption || row.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{prettySize(row.size)}{row.author ? ` · ${row.author}` : ''}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
