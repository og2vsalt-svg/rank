import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Sheet = {
  id: string;
  title?: string;
  later?: string;
  file_name?: string | null;
  size?: number;
  author?: string | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function UnderwritingPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Sheet[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/palimpsest')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'could not read the index');
          return;
        }
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('could not read the index'));
  }, []);

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-16 apple-in">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[#64d2ff]/80">underwriting</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Later writings already filed.</h1>
        <p className="mt-3 text-neutral-400 leading-relaxed">A public index, not a cabinet. Open one for the file and the Discord card. The vault stays on its own route.</p>
        <button onClick={() => navigate('palimpsest')} className="mt-5 px-4 py-2 rounded-full bg-white text-black text-sm font-medium">write over a file</button>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6 space-y-3">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate('palimpsest', row.id)}
              className="w-full text-left glass rounded-3xl p-5 hover:-translate-y-0.5 transition-transform"
            >
              <p className="font-medium">{row.title || row.file_name || row.id}</p>
              <p className="mt-1 text-sm text-neutral-500">{row.file_name || 'file'} · {pretty(Number(row.size) || 0)} · {row.author || 'unsigned'}</p>
              {row.later ? <p className="mt-2 text-sm text-neutral-300 line-clamp-2">{row.later}</p> : null}
            </motion.button>
          ))}
          {!error && rows.length === 0 ? <p className="text-sm text-neutral-500">nothing written over yet.</p> : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
