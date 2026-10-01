import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

type Seat = { name: string; note: string };

const empty: Seat[] = [
  { name: 'left', note: '' },
  { name: 'centre', note: '' },
  { name: 'right', note: '' },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SediliaPage() {
  const [seats, setSeats] = useState<Seat[]>(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rankvault-sedilia');
      if (raw) setSeats(JSON.parse(raw));
    } catch {
      /* keep the three empty seats */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rankvault-sedilia', JSON.stringify(seats));
  }, [seats]);

  const update = (i: number, note: string) => {
    setSeats((prev) => prev.map((s, idx) => (idx === i ? { ...s, note } : s)));
  };

  const send = async () => {
    setBusy(true);
    setErr('');
    const text = seats.map((s) => `## ${s.name}\n${s.note || '—'}\n`).join('\n');
    const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`;
    const next = uid();
    const res = await publishShare({
      id: next,
      name: 'sedilia.md',
      type: 'text/markdown',
      size: new Blob([text]).size,
      dataUrl,
      caption: 'three seats',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not publish the seats');
      return;
    }
    setId(res.id);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">sedilia</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">three seats in the wall</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            Short reminders live on this device. Publishing writes a markdown note to the share database so Discord can unfurl /s. This is not a file grid.
          </p>
        </motion.div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {seats.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass rounded-3xl p-4">
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">{s.name}</p>
              <textarea value={s.note} onChange={(e) => update(i, e.target.value)} rows={6} placeholder="a line for this seat" className="mt-2 w-full resize-none bg-transparent text-[14px] leading-relaxed outline-none" />
            </motion.div>
          ))}
        </div>
        <button onClick={send} disabled={busy} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-40">
          {busy ? 'publishing…' : 'publish the three seats'}
        </button>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {id && <p className="mt-3 break-all text-[14px] text-white/70">{shareUrls(id).embed}</p>}
      </main>
    </div>
  );
}
