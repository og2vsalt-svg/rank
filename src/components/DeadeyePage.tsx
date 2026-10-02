import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const ease = [0.22, 1, 0.36, 1] as const;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function DeadeyePage() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState('one sitting');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setRunning(false);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const spent = Math.max(0, seconds - left);

  const fileNote = async () => {
    setBusy(true);
    setError('');
    const text = `deadeye\n${label}\nplanned ${Math.round(seconds / 60)} min\nspent ${Math.round(spent / 60)} min\n`;
    const file = new File([text], 'deadeye.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      caption: `${label} · ${Math.round(spent / 60)} min`,
      cardTitle: label || 'deadeye sitting',
      color: '#FF9F0A',
    });
    if (res.ok && res.embed) setEmbed(res.embed);
    else setError(res.error || 'did not land');
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28 text-center">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-zinc-500">deadeye</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A sitting, not a drawer.</motion.h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-zinc-400">Keep the clock in the tab. File the note only if you want Discord to unfurl the sitting.</p>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }} className="mx-auto mt-10 max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] px-6 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <p className="font-semibold tabular-nums tracking-tight text-white" style={{ fontSize: 72 }}>{pad(mm)}:{pad(ss)}</p>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center text-sm outline-none transition focus:border-[#FF9F0A]/70" />
          <div className="mt-4 flex justify-center gap-2">
            {[15, 25, 45].map((m) => (
              <button key={m} onClick={() => { setSeconds(m * 60); setLeft(m * 60); setRunning(false); }} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5">{m}m</button>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => setRunning((v) => !v)} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition active:scale-[0.98]">{running ? 'pause' : 'start'}</button>
            <button onClick={() => { setRunning(false); setLeft(seconds); }} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-200">reset</button>
          </div>
          <button disabled={busy} onClick={fileNote} className="mt-4 text-sm text-[#FF9F0A] disabled:opacity-40">{busy ? 'filing…' : 'file this sitting'}</button>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {embed && <a className="mt-3 block text-sm text-[#FF9F0A]" href={embed}>{embed}</a>}
        </motion.div>
      </main>
    </div>
  );
}
