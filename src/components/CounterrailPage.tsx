import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Seat = { label: string; note: string };

const EMPTY: Seat[] = [
  { label: 'port', note: '' },
  { label: 'mid', note: '' },
  { label: 'starboard', note: '' },
];

export default function CounterrailPage() {
  const [seats, setSeats] = useState<Seat[]>(EMPTY);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rankvault-counterrail');
      if (raw) setSeats(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('rankvault-counterrail', JSON.stringify(seats));
  }, [seats]);

  function setNote(i: number, note: string) {
    setSeats((prev) => prev.map((s, n) => (n === i ? { ...s, note } : s)));
  }

  async function publish() {
    setBusy(true);
    setErr('');
    try {
      const text = seats.map((s) => `## ${s.label}\n${s.note || '—'}`).join('\n\n');
      const file = new File([text], 'counterrail.md', { type: 'text/markdown' });
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('caption', seats.map((s) => s.note).filter(Boolean).join(' · ').slice(0, 180));
      form.append('author', 'counterrail');
      const res = await fetch('/api/quay', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'the rail did not publish');
      setLink(data.card || `/s/${data.id}`);
    } catch (e: any) {
      setErr(e.message || 'quiet failure');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-4xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">counterrail</motion.p>
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">three seats, not a drawer</h1>
        <p className="text-neutral-400 text-sm mb-8">notes stay on this device. publish only if you want a Discord card.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {seats.map((seat, i) => (
            <motion.div key={seat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass rounded-3xl p-5">
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{seat.label}</p>
              <textarea value={seat.note} onChange={(e) => setNote(i, e.target.value)} rows={8} className="w-full bg-transparent text-sm text-white outline-none resize-none" placeholder="a line for this seat" />
            </motion.div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button type="button" disabled={busy} onClick={publish} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'publishing…' : 'publish the rail'}</button>
          {err && <p className="text-xs text-red-300">{err}</p>}
          {link && <a className="text-sm text-[#0a84ff]" href={link}>{link}</a>}
        </div>
      </main>
    </div>
  );
}
