import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Sounding = {
  id: string;
  target: string;
  note?: string;
  status_code?: number;
  ok?: boolean;
  elapsed_ms?: number;
  author?: string;
  created_at?: string;
};

export default function SoundingPage() {
  const { shareId } = useRouter();
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('an address, a reading, a row. not a drawer.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<Sounding[]>([]);
  const [open, setOpen] = useState<Sounding | null>(null);

  useEffect(() => {
    fetch('/api/sounding')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.soundings) ? data.soundings : []))
      .catch(() => setRecent([]));
  }, [card]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/sounding?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setOpen(data.sounding || null))
      .catch(() => setOpen(null));
  }, [shareId]);

  async function take() {
    if (busy || !target.trim()) return;
    setBusy(true);
    setStatus('taking the sounding…');
    try {
      const r = await fetch('/api/sounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, note, author }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the soundings table did not take the reading');
      setCard(`${window.location.origin}/sounding/${data.id}`);
      setStatus(data.warn || 'reading kept. paste the card in Discord.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not take that sounding');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">
          sounding
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-[40px] leading-none font-semibold tracking-tight"
        >
          A reading, not a drawer.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Paste an address. Rankvault asks it once, keeps the status and the wait, and gives you a Discord card. No file is stored here.
        </p>

        {open && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 rounded-3xl p-5">
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/35">{open.ok ? 'answered' : 'no answer'}</p>
            <p className="mt-2 text-[18px] tracking-tight break-all">{open.target}</p>
            <p className="mt-2 text-[13px] text-white/45">
              {open.status_code || 0} · {open.elapsed_ms || 0} ms{open.note ? ` · ${open.note}` : ''}
            </p>
          </motion.article>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-5 space-y-3"
        >
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://…" className="w-full rounded-2xl bg-white/5 px-4 py-3 text-[14px] outline-none" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why you checked" className="rounded-2xl bg-white/5 px-4 py-3 text-[14px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl bg-white/5 px-4 py-3 text-[14px] outline-none" />
          </div>
          <button onClick={take} disabled={busy || !target.trim()} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'Reading…' : 'Take the sounding'}
          </button>
          <p className="text-[13px] text-white/50">{status}</p>
        </motion.div>

        {card && (
          <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={card} className="glass mt-6 block rounded-2xl px-4 py-3 text-[14px] text-[#64b5ff]">
            {card}
          </motion.a>
        )}

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[13px] tracking-[0.14em] uppercase text-white/35">recent readings</h2>
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 8).map((row) => (
                <li key={row.id}>
                  <a href={`/sounding/${row.id}`} className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[14px]">
                    <span className="min-w-0 truncate text-white/80">{row.target}</span>
                    <span className="shrink-0 text-white/35">{row.status_code || 0}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
