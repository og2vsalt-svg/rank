import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  doorway: string;
  dedication?: string | null;
  author?: string | null;
  file_name?: string | null;
  size?: number | null;
  seen_count?: number | null;
  created_at?: string;
};

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function pretty(n: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VoussoirPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState('');

  async function load() {
    const res = await fetch(`${SB_URL}/rest/v1/tympanum_fields?select=id,doorway,dedication,author,file_name,size,seen_count,created_at&order=created_at.desc&limit=40`, { headers: headers() });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load().catch(() => setRows([])); }, []);

  async function mark(row: Row) {
    setBusy(row.id);
    try {
      const next = Number(row.seen_count || 0) + 1;
      await fetch(`${SB_URL}/rest/v1/tympanum_fields?id=eq.${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ seen_count: next }),
      });
      setRows((list) => list.map((item) => item.id === row.id ? { ...item, seen_count: next } : item));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">voussoir</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">wedges already set</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">A public arch of fields already raised. Open one, or mark that you passed under it. No upload on this page. Discord unfurls /voussoir.</p>
        <button onClick={() => navigate('tympanum')} className="mt-6 rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white transition active:scale-[0.98]">raise a field</button>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {rows.length === 0 && <p className="text-[15px] text-[#6e6e73]">nothing in the arch yet.</p>}
          {rows.map((row, i) => (
            <motion.article key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }} className="rounded-[24px] bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              <p className="text-[12px] uppercase tracking-[0.14em] text-[#6e6e73]">wedge</p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{row.doorway}</h2>
              {row.dedication && <p className="mt-2 text-[15px] leading-relaxed text-[#3a3a3c]">{row.dedication}</p>}
              <p className="mt-3 text-[13px] text-[#6e6e73]">{row.file_name}{row.size ? ` · ${pretty(Number(row.size))}` : ''}{row.author ? ` · ${row.author}` : ''}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => navigate('tympanum', row.id)} className="rounded-full bg-[#f5f5f7] px-3.5 py-1.5 text-[13px]">open</button>
                <button disabled={busy === row.id} onClick={() => mark(row)} className="rounded-full bg-[#f5f5f7] px-3.5 py-1.5 text-[13px] disabled:opacity-60">{busy === row.id ? 'marking…' : `passed under · ${row.seen_count || 0}`}</button>
              </div>
            </motion.article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
