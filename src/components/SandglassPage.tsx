import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Filed = { id: string; name: string; mime?: string; size: number; caption?: string; author?: string; file_url?: string; keep_until?: string; created_at?: string };

export default function SandglassPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Filed[]>([]);
  const [status, setStatus] = useState('reading the glass…');

  useEffect(() => {
    fetch('/api/watchglass?list=1')
      .then((r) => r.json())
      .then((data) => {
        setRows(data.files || []);
        setStatus((data.files || []).length ? 'files already in the share table.' : 'nothing filed yet.');
      })
      .catch(() => setStatus('could not read the index.'));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">index</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">sandglass</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">A public index of watchglass drops already written into the database. Open one to read the note and the file. Discord unfurls /sandglass. Not a vault drawer.</p>
        </motion.div>
        <p className="mt-6 text-[13px] text-[#6e6e73]">{status}</p>
        <div className="mt-4 space-y-3">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate('watchglass', row.id)}
              className="block w-full rounded-[24px] bg-white px-5 py-4 text-left shadow-[0_12px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5"
            >
              <span className="block text-[16px] font-medium">{row.name}</span>
              <span className="mt-1 block text-[13px] text-[#6e6e73]">{row.caption || 'no note'} · {pretty(row.size)}{row.author ? ` · ${row.author}` : ''}</span>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
