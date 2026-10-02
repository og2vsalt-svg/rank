import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Edge = { id: string; label: string; minutes: number; at: string };

const KEY = 'rankvault-arris';

export default function ArrisPage() {
  const [label, setLabel] = useState('quiet sitting');
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [run, setRun] = useState(false);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEdges(JSON.parse(raw));
    } catch {
      setEdges([]);
    }
  }, []);

  useEffect(() => {
    if (!run) return;
    const t = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          setRun(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [run]);

  const stamp = () => {
    const edge: Edge = { id: crypto.randomUUID(), label: label.trim() || 'sitting', minutes, at: new Date().toISOString() };
    const next = [edge, ...edges].slice(0, 40);
    setEdges(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const fileNote = async () => {
    setBusy(true);
    setErr('');
    const body = edges.map((e) => `- ${e.label} · ${e.minutes}m · ${e.at}`).join('\n') || `${label} · ${minutes}m`;
    const file = new File([`arris\n\n${body}\n`], 'arris.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { cardTitle: label || 'arris', caption: `${edges.length || 1} sittings` });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not file the note');
      return;
    }
    setLink(shareUrls(res.id).embed);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">sitting</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">arris</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            A timer for one edge of the day. The log stays here until you file a note. Discord gets the card, not a cabinet.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-6 text-center"
        >
          <p className="text-6xl font-semibold tracking-tight tabular-nums">{mm}:{ss}</p>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-center outline-none" />
          <input type="range" min={5} max={90} value={minutes} onChange={(e) => { const n = Number(e.target.value); setMinutes(n); if (!run) setLeft(n * 60); }} className="mt-4 w-full" />
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => setRun((v) => !v)} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium">{run ? 'pause' : 'start'}</button>
            <button onClick={() => { setRun(false); setLeft(minutes * 60); }} className="rounded-full bg-white/10 px-5 py-2.5 text-sm">reset</button>
            <button onClick={stamp} className="rounded-full bg-white/10 px-5 py-2.5 text-sm">stamp</button>
          </div>
        </motion.section>

        <section className="mt-4">
          <button onClick={fileNote} disabled={busy} className="rounded-full bg-white/10 px-5 py-2.5 text-sm disabled:opacity-40">{busy ? 'filing…' : 'file the note'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm text-neutral-300 break-all">{link}</p>}
          <ul className="mt-4 space-y-2">
            {edges.map((e) => (
              <li key={e.id} className="glass rounded-2xl px-4 py-3 text-sm text-neutral-300">{e.label} · {e.minutes}m</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
