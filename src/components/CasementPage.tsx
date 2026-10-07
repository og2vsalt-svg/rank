import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { db } from '../lib/db';

type Row = { id: string; label: string; note: string | null; author: string | null; created_at: string };

export default function CasementPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`${db.url}/rest/v1/transoms?select=id,label,note,author,created_at&open=eq.true&order=created_at.desc&limit=40`, {
      headers: { apikey: db.key, Authorization: `Bearer ${db.key}` },
    }).then(async (res) => {
      if (!res.ok) {
        setErr('could not read the windows');
        return;
      }
      setRows(await res.json());
    }).catch(() => setErr('could not read the windows'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm mb-2">index</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">casement</h1>
          <p className="text-neutral-400 text-sm mb-6">open receiving windows. this page does not hold files. paste /casement in Discord for the card.</p>
          <button onClick={() => navigate('transom')} className="mb-6 px-4 py-2 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition">open a window</button>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <div className="grid gap-3">
            {rows.map((row, i) => (
              <motion.button key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} onClick={() => navigate('transom', row.id)} className="text-left glass rounded-3xl px-5 py-4 hover:-translate-y-0.5 transition-transform">
                <p className="font-medium">{row.label}</p>
                <p className="text-sm text-neutral-400 mt-1">{row.note || 'no note'}{row.author ? ` · ${row.author}` : ''}</p>
              </motion.button>
            ))}
            {!rows.length && !err && <p className="text-sm text-neutral-500">no windows yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
