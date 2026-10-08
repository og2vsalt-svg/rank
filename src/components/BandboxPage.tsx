import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  label: string;
  lining?: string | null;
  accent?: string | null;
  file_name?: string | null;
  size?: number | null;
  author?: string | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BandboxPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [tone, setTone] = useState('all');

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/etuis?select=id,label,lining,accent,file_name,size,author&order=created_at.desc&limit=48`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, []);

  const tones = ['all', ...Array.from(new Set(rows.map((r) => r.accent).filter(Boolean)))];
  const shown = tone === 'all' ? rows : rows.filter((r) => r.accent === tone);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <p className="text-[13px] tracking-wide text-[#6e6e73]">bandbox</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">The shop window, not the cabinet.</h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
          Cases already filed. Open one for the file. This page does not hold a drawer of its own.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {tones.map((c) => (
            <button key={String(c)} onClick={() => setTone(String(c))} className="rounded-full bg-white px-3 py-1.5 text-[13px] shadow-sm" style={{ outline: tone === c ? '2px solid #1d1d1f' : 'none' }}>
              {c === 'all' ? 'all' : 'tone'}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {shown.map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => navigate('etui', row.id)}
              className="rounded-[24px] bg-white p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5"
            >
              <div className="h-1.5 w-12 rounded-full" style={{ background: row.accent || '#0A84FF' }} />
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight">{row.label}</h2>
              {row.lining && <p className="mt-1 line-clamp-2 text-[14px] text-[#6e6e73]">{row.lining}</p>}
              <p className="mt-3 text-[12px] text-[#86868b]">{row.file_name} · {pretty(Number(row.size) || 0)}</p>
            </motion.button>
          ))}
          {!shown.length && <p className="text-[15px] text-[#6e6e73]">nothing in the window yet. file a case on etui.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
