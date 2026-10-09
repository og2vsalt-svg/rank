import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Slip = { id: string; recipient: string; condition: string; file_name?: string | null; size?: number | null; created_at?: string | null };

function pretty(n: number) {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SacristyPage() {
  const [rows, setRows] = useState<Slip[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/reliquary_slips?select=id,recipient,condition,file_name,size,created_at&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((body) => setRows(Array.isArray(body) ? body : []))
      .catch(() => setError('the index did not open'));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">sacristy</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] font-semibold tracking-tight">receipts already filed</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">A public index of reliquary slips. Open one to read the condition and the file. Discord unfurls /sacristy. This is not a vault drawer. Older desks stay on their routes.</p>
        <a href="/reliquary" className="mt-6 inline-flex rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white transition active:scale-[0.98]">file a receipt</a>
        {error && <p className="mt-6 text-[14px] text-[#ff3b30]">{error}</p>}
        <div className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.a key={row.id} href={`/reliquary/${row.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="block rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5">
              <p className="text-[12px] uppercase tracking-[0.14em] text-[#6e6e73]">for {row.recipient}</p>
              <p className="mt-1 text-[17px] font-medium tracking-tight">{row.condition}</p>
              <p className="mt-2 text-[13px] text-[#6e6e73]">{row.file_name}{row.size ? ` · ${pretty(row.size)}` : ''}</p>
            </motion.a>
          ))}
          {!error && rows.length === 0 && <p className="text-[15px] text-[#6e6e73]">no receipts yet. the first one will sit here.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
