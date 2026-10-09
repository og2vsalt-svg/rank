import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  bearer: string;
  load_note: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  created_at: string;
};

type Mark = { id: string; corbel_id: string; passer: string | null; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function MetopePage() {
  const { shareId } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [passer, setPasser] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<Row | null>(null);

  const load = () => {
    sbRest('corbels?select=*&order=created_at.desc&limit=24')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
    sbRest('metope_marks?select=*&order=created_at.desc&limit=24')
      .then((r) => r.json())
      .then((data) => setMarks(Array.isArray(data) ? data : []))
      .catch(() => setMarks([]));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`corbels?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setOpen(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const stamp = async (id: string) => {
    setErr('');
    const res = await sbRest('metope_marks', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ corbel_id: id, passer: passer.trim() || null }),
    });
    if (!res.ok) {
      setErr((await res.text()).slice(0, 160));
      return;
    }
    const saved = await res.json();
    const next = Array.isArray(saved) ? saved[0] : null;
    if (next) setMarks((prev) => [next, ...prev]);
  };

  const shown = open;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          between the brackets
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Metope
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Panels already hung on corbel. Open one, download the file, leave a passer mark. No new upload on this page. Paste /metope/id in Discord for a card.
        </p>
        <input value={passer} onChange={(e) => setPasser(e.target.value)} placeholder="your name on the mark, optional" className="mt-6 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#64d2ff]" />
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}

        {shown && (
          <motion.article layout className="mt-6 overflow-hidden rounded-3xl border border-[#64d2ff]/40 bg-white/[0.04]">
            {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">{shown.bearer}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shown.file_name}</h2>
              <p className="mt-2 text-sm text-white/60">{shown.load_note || 'no load note'} · {pretty(Number(shown.size) || 0)}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <a href={shown.file_url} className="text-[#b6ecff]">download</a>
                <button onClick={() => stamp(shown.id)} className="text-white/70">mark that you passed</button>
              </div>
            </div>
          </motion.article>
        )}

        <ul className="mt-8 space-y-2">
          {rows.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <a href={`/metope/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span>{item.bearer}</span>
                <span className="text-white/40">{marks.filter((m) => m.corbel_id === item.id).length} marks</span>
              </a>
            </motion.li>
          ))}
          {!rows.length && <li className="text-sm text-white/40">no brackets hung yet. set one on corbel.</li>}
        </ul>
      </main>
    </div>
  );
}
