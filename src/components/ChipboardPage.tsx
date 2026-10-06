import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Filed = { id: string; name: string; size: number; caption?: string; author?: string; created_at?: string; meta?: { bearing?: string } };

export default function ChipboardPage() {
  const [rows, setRows] = useState<Filed[]>([]);
  const [status, setStatus] = useState('reading the board…');

  useEffect(() => {
    fetch('/api/logline?list=1')
      .then((r) => r.json())
      .then((data) => {
        setRows(data.files || []);
        setStatus((data.files || []).length ? '' : 'nothing filed on the line yet.');
      })
      .catch(() => setStatus('the board did not answer.'));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">index</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">chipboard</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">A public list of files already written into the share table from logline. It is not a vault drawer. Paste /chipboard in Discord for the card.</p>
        </motion.div>
        {status && <p className="mt-8 text-[14px] text-[#6e6e73]">{status}</p>}
        <section className="mt-6 space-y-3">
          {rows.map((row, i) => (
            <motion.a
              key={row.id}
              href={`/logline/${row.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="block rounded-[22px] bg-white/80 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5"
            >
              <p className="text-[15px] font-medium">{row.name}</p>
              <p className="mt-1 text-[13px] text-[#6e6e73]">{row.meta?.bearing ? `bearing ${row.meta.bearing} · ` : ''}{pretty(row.size)}{row.author ? ` · ${row.author}` : ''}</p>
            </motion.a>
          ))}
        </section>
      </main>
    </div>
  );
}
