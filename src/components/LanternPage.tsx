import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const PRESETS = [15, 25, 45];

export default function LanternPage() {
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [warmth, setWarmth] = useState(42);
  const [line, setLine] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  const fileIt = async () => {
    setBusy(true);
    setError('');
    const body = `lantern\nset for ${minutes} minutes\nleft ${mm}:${ss}\nwarmth ${warmth}\n${line.trim()}\n`;
    const file = new File([body], 'lantern.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: `lantern · ${minutes}m`, color: '#C4A574' });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'the note did not land');
      return;
    }
    setCard(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">lantern</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A lamp for one sitting.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">A timer and a warm wash. Not a cabinet. If you want the sitting on Discord, file the note — it lands in the share table as text.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <motion.div animate={{ opacity: warmth / 140 }} className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,196,120,0.45),transparent_62%)]" />
          <div className="relative">
            <p className="text-7xl font-semibold tracking-tight text-white tabular-nums">{mm}:{ss}</p>
            <div className="mt-4 flex gap-2">
              {PRESETS.map((n) => (
                <button key={n} onClick={() => { setMinutes(n); setLeft(n * 60); setRunning(false); }} className={`rounded-full px-3 py-1.5 text-sm ${minutes === n ? 'bg-white text-black' : 'bg-white/10 text-zinc-300'}`}>{n}m</button>
              ))}
            </div>
            <label className="mt-5 block text-sm text-zinc-400">warmth
              <input type="range" min={8} max={100} value={warmth} onChange={(e) => setWarmth(Number(e.target.value))} className="mt-2 w-full accent-[#C4A574]" />
            </label>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setRunning((v) => !v)} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white">{running ? 'pause' : 'light'}</button>
              <button onClick={() => { setRunning(false); setLeft(minutes * 60); }} className="rounded-full px-4 py-2.5 text-sm text-zinc-400">reset</button>
            </div>
            <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder="what the sitting was for" className="mt-5 h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
            <button disabled={busy} onClick={fileIt} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40">{busy ? 'filing…' : 'file the sitting'}</button>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            {card && <a className="mt-3 block text-sm text-[#7ab8ff] underline" href={card}>{card}</a>}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
