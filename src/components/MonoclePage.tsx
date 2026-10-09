import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  title: string;
  looking_for: string;
  accent?: string | null;
  file_name?: string | null;
  size?: number | null;
  looks?: number | null;
  created_at?: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1048576) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

export default function MonoclePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let gone = false;
    fetch(`${SB_URL}/rest/v1/lorgnettes?select=id,title,looking_for,accent,file_name,size,looks,created_at&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => { if (!gone) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (!gone) setRows([]); });
    return () => { gone = true; };
  }, []);

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-500 mb-3">public board</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">Monocle</h1>
          <p className="text-neutral-400 max-w-xl mb-8 leading-relaxed">
            Glasses already raised. Open one to read the marks and download the file. Nothing new is uploaded from this page.
          </p>
          <button onClick={() => navigate('lorgnette')} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium active:scale-[0.98] transition mb-8">Raise a new glass</button>
        </motion.div>
        {rows === null && <p className="text-sm text-neutral-500">opening…</p>}
        {rows && rows.length === 0 && <p className="text-sm text-neutral-500">No glasses yet. The first one lands on the lorgnette desk.</p>}
        <div className="space-y-3">
          {(rows || []).map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => navigate('lorgnette', row.id)}
              className="w-full text-left glass rounded-3xl px-5 py-4 hover:bg-white/[0.04] transition"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium tracking-tight">{row.title || row.file_name || 'untitled'}</p>
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: row.accent || '#0A84FF' }} />
              </div>
              <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{row.looking_for}</p>
              <p className="text-xs text-neutral-500 mt-2">{row.file_name || 'file'} · {pretty(Number(row.size) || 0)} · {Number(row.looks) || 0} looks</p>
            </motion.button>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
