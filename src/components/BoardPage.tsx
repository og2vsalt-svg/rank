import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { getShare, listShares, prettySize } from '../lib/db';
import { useRouter } from './Router';

type Share = {
  id: string;
  name: string;
  mime?: string;
  size: number;
  file_url: string;
  author?: string;
  caption?: string;
  created_at: string;
};

export default function BoardPage() {
  const { shareId } = useRouter();
  const [rows, setRows] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listShares().then(setRows).catch(() => setError('the board did not load'));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    getShare(shareId).then(setFocus).catch(() => setFocus(null));
  }, [shareId]);

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[#64d2ff] text-sm mb-3">board</p>
        <h1 className="text-4xl font-semibold tracking-tight mb-3">What people left out.</h1>
        <p className="text-neutral-400 mb-8">Recent public shares. Paste /board or /s/id in Discord and the card follows the link.</p>
        {focus && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">open share</p>
            <h2 className="text-2xl font-medium tracking-tight">{focus.name}</h2>
            <p className="text-neutral-400 text-sm mt-1">{focus.caption || 'no caption'} · {prettySize(focus.size)}{focus.author ? ` · ${focus.author}` : ''}</p>
            {focus.mime?.startsWith('image/') && <img src={focus.file_url} alt="" className="mt-4 rounded-2xl max-h-80 object-cover" />}
            <a href={focus.file_url} className="inline-flex mt-4 text-sm text-[#0a84ff]" target="_blank" rel="noreferrer">download</a>
          </motion.article>
        )}
        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
        <div className="grid gap-3">
          {rows.map((row, i) => (
            <motion.a key={row.id} href={`/s/${row.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium truncate">{row.name}</span>
                <span className="text-xs text-neutral-500 shrink-0">{prettySize(row.size)}</span>
              </div>
              <p className="text-sm text-neutral-500 truncate mt-1">{row.caption || row.author || row.id}</p>
            </motion.a>
          ))}
          {!rows.length && !error && <p className="text-neutral-500 text-sm">Nothing public yet. The shelf is the place to leave one.</p>}
        </div>
      </main>
    </div>
  );
}
