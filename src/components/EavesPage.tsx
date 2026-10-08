import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Loft = { id: string; title?: string | null; caption?: string | null; file_name?: string | null; size?: number; author?: string | null; created_at?: string };

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function EavesPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Loft[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/loft').then(async (res) => {
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'could not read the eaves'); return; }
      setRows(data.lofts || []);
    }).catch(() => setError('could not reach the eaves'));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-28">
        <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">rankvault · eaves</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">What is already hung.</h1>
        <p className="mt-3 max-w-xl text-[17px] text-[#6e6e73]">A public index of loft rooms. Open one to read the caption and the file. Not a cabinet.</p>
        {error ? <p className="mt-6 text-sm text-[#b42318]">{error}</p> : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {rows.map((row, i) => (
            <motion.button key={row.id} type="button" onClick={() => navigate('loft', row.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 26 }} className="rounded-[24px] bg-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#86868b]">{row.author || 'unsigned'}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{row.title || row.file_name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-[#6e6e73]">{row.caption || 'no caption'}</p>
              <p className="mt-3 text-xs text-[#86868b]">{row.file_name} · {pretty(row.size || 0)}</p>
            </motion.button>
          ))}
        </div>
        {!error && rows.length === 0 ? <p className="mt-8 text-sm text-[#6e6e73]">Nothing hung yet. File one from the loft.</p> : null}
      </main>
      <Footer />
    </div>
  );
}
