import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Stop = { name: string; receivedAt?: string | null };
type Bill = {
  id: string;
  title: string;
  receiver: string | null;
  note: string | null;
  file_name: string | null;
  file_url: string | null;
  size: number;
  pretty?: string;
  stops: Stop[];
  warn?: string | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function PorterPage() {
  const { shareId } = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [open, setOpen] = useState<Bill | null>(null);
  const [err, setErr] = useState('');

  async function loadList() {
    const r = await fetch('/api/waybill');
    const data = await r.json().catch(() => ({}));
    setBills(Array.isArray(data.bills) ? data.bills : []);
  }

  useEffect(() => { loadList().catch(() => {}); }, []);

  useEffect(() => {
    if (!shareId) { setOpen(null); return; }
    fetch(`/api/waybill?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing waybill');
        setOpen(data);
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that slip'));
  }, [shareId]);

  async function stamp(id: string, stop: string) {
    const r = await fetch('/api/waybill', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stop }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(data.error || 'could not stamp that stop'); return; }
    setOpen((cur) => cur && cur.id === id ? { ...cur, stops: data.stops } : cur);
    setBills((rows) => rows.map((row) => row.id === id ? { ...row, stops: data.stops } : row));
  }

  const shown = open ? [open] : bills;

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">porter</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">The board, not the drawer.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">Waybills already filed. Stamp a stop when it lands. Paste /porter or /waybill/id in Discord for the card. No new size cap.</p>
        {err ? <p className="mt-4 text-sm text-[#ff453a]">{err}</p> : null}
        <ul className="mt-8 space-y-3">
          {shown.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35, ease }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <a href={`/waybill/${row.id}`} className="text-lg font-medium text-white">{row.title || row.receiver || 'waybill'}</a>
              {row.note ? <p className="mt-1 text-sm text-[#d1d1d6]">{row.note}</p> : null}
              <p className="mt-2 text-xs text-[#8e8e93]">{row.file_name || 'note only'}{row.pretty ? ` · ${row.pretty}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(row.stops || []).map((stop) => (
                  <button key={stop.name} disabled={!!stop.receivedAt} onClick={() => stamp(row.id, stop.name)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#d1d1d6] disabled:text-[#64d2ff] active:scale-[0.98] transition">
                    {stop.receivedAt ? `${stop.name} · received` : `stamp ${stop.name}`}
                  </button>
                ))}
              </div>
              {row.file_url && !String(row.file_url).startsWith('data:') ? <a href={row.file_url} className="mt-4 inline-flex text-sm text-[#64d2ff]" download={row.file_name || 'file'}>download</a> : null}
            </motion.li>
          ))}
        </ul>
        {!shown.length ? <p className="mt-8 text-sm text-[#8e8e93]">no waybills yet. file one at /waybill.</p> : null}
      </main>
      <Footer />
    </div>
  );
}
