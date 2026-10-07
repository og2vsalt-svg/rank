import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Slip = {
  id: string;
  title: string;
  for_whom: string | null;
  note: string | null;
  author: string | null;
  file_name: string;
  size: number;
  file_url: string;
  received_at: string | null;
  received_by: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AckPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Slip[]>([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    sbRest('billets?select=id,title,for_whom,note,author,file_name,size,file_url,received_at,received_by,created_at&order=created_at.desc&limit=40')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  const mark = async (id: string) => {
    setErr('');
    const res = await sbRest(`billets?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ received_at: new Date().toISOString(), received_by: name || 'desk' }),
    });
    if (!res.ok) {
      setErr((await res.text()).slice(0, 160));
      return;
    }
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">receipt board</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">Ack</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Not a file vault. This is the board where a billet gets marked received. The stamp writes back to the same row. Paste /ack in Discord for a card.</p>
        <label className="mt-6 block text-sm text-white/60">
          your name on the stamp
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="optional" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
        </label>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        <ul className="mt-6 space-y-3">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => navigate('billet', row.id)} className="text-left">
                  <span className="block text-base font-medium">{row.title}</span>
                  <span className="mt-1 block text-xs text-white/45">{row.file_name} · {pretty(Number(row.size) || 0)}{row.for_whom ? ` · for ${row.for_whom}` : ''}</span>
                </button>
                {row.received_at ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">received{row.received_by ? ` · ${row.received_by}` : ''}</span>
                ) : (
                  <button onClick={() => mark(row.id)} className="rounded-full bg-[#0a84ff] px-3 py-1 text-xs font-medium text-white transition-transform duration-200 hover:scale-[1.03]">mark received</button>
                )}
              </div>
              {row.note && <p className="mt-2 text-sm text-white/65">{row.note}</p>}
              <a href={row.file_url} className="mt-2 inline-block text-xs text-[#0a84ff]">open file</a>
            </motion.li>
          ))}
          {!rows.length && <li className="text-sm text-white/40">no slips yet. file one on billet.</li>}
        </ul>
      </main>
    </div>
  );
}
