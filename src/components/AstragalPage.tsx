import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  name: string;
  caption: string | null;
  author: string | null;
  mime: string | null;
  file_url: string | null;
  size: number;
  created_at: string;
  meta?: { desk?: string; forWhom?: string; openBy?: string; courtesy?: string; acks?: string[] } | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AstragalPage() {
  const { shareId, navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<Row | null>(null);
  const [ack, setAck] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    sbRest('public_shares?select=id,name,caption,author,mime,file_url,size,created_at,meta&is_public=eq.true&order=created_at.desc&limit=40')
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setRows(all.filter((item) => item?.meta?.desk === 'lunette'));
      })
      .catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    const found = rows.find((item) => item.id === shareId);
    if (found) setOpen(found);
    else {
      sbRest(`public_shares?id=eq.${encodeURIComponent(shareId)}&select=id,name,caption,author,mime,file_url,size,created_at,meta&limit=1`)
        .then((r) => r.json())
        .then((data) => setOpen(Array.isArray(data) ? data[0] || null : null))
        .catch(() => setOpen(null));
    }
  }, [shareId, rows]);

  const leaveAck = async () => {
    if (!open || !ack.trim()) return;
    setErr('');
    const acks = [...(open.meta?.acks || []), ack.trim().slice(0, 180)].slice(-8);
    const res = await fetch('/api/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: open.id, meta: { acks } }),
    });
    if (!res.ok) {
      setErr('the strip could not keep that line yet');
      return;
    }
    const next = { ...open, meta: { ...(open.meta || {}), acks } };
    setOpen(next);
    setRows((prev) => prev.map((item) => (item.id === next.id ? next : item)));
    setAck('');
    setNote('kept on the strip');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-black/40">strip, not a cabinet</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Astragal</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-black/60">No upload here. This is the public strip of lunette windows already filed. Open one, download the file, or leave a short acknowledgment. Paste /astragal in Discord for a card.</p>
        <ul className="mt-8 space-y-2">
          {rows.length === 0 && <li className="rounded-2xl bg-white px-4 py-6 text-sm text-black/45">no windows on the strip yet. open one from lunette.</li>}
          {rows.map((item) => (
            <li key={item.id}>
              <button onClick={() => navigate('astragal', item.id)} className="flex w-full items-center justify-between rounded-2xl border border-black/8 bg-white px-4 py-3 text-left text-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                <span>
                  <span className="block font-medium">for {item.meta?.forWhom || item.name}</span>
                  <span className="block text-black/45">{item.meta?.courtesy || item.caption || 'window'}</span>
                </span>
                <span className="shrink-0 text-black/40">{pretty(Number(item.size) || 0)}</span>
              </button>
            </li>
          ))}
        </ul>
        {open && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
            <p className="text-xs uppercase tracking-[0.14em] text-black/40">open window</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">for {open.meta?.forWhom || open.name}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-black/75">{open.meta?.courtesy || open.caption}</p>
            {open.meta?.openBy && <p className="mt-2 text-sm text-black/45">might open by {open.meta.openBy.replace('T', ' ')}</p>}
            {open.file_url && <a href={open.file_url} className="mt-3 inline-block text-sm text-[#0a84ff]">download {open.name}</a>}
            <div className="mt-4 space-y-1">
              {(open.meta?.acks || []).map((line, i) => (
                <p key={`${line}-${i}`} className="text-sm text-black/60">— {line}</p>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input value={ack} onChange={(e) => setAck(e.target.value)} placeholder="a short acknowledgment" className="w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
              <button onClick={leaveAck} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-sm text-white">keep</button>
            </div>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            {note && <p className="mt-2 text-sm text-black/45">{note}</p>}
          </motion.article>
        )}
      </main>
    </div>
  );
}
