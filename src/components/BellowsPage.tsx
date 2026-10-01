import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function BellowsPage() {
  const [seconds, setSeconds] = useState(4 * 60);
  const [left, setLeft] = useState(4 * 60);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState('');
  const [embed, setEmbed] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          setRunning(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const scale = seconds ? 1 - left / seconds : 1;

  const publish = async () => {
    const text = `bellows\nheld for ${seconds - left}s of ${seconds}s\n\n${note.trim()}\n`;
    const file = new File([text], 'bellows.txt', { type: 'text/plain' });
    setBusy(true);
    const res = await publishLocalFile(file, { caption: note.trim().slice(0, 140) || 'a timed breath', color: '#30D158' });
    setBusy(false);
    if (res.ok && res.embed) setEmbed(res.embed);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">bellows</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a breath you can time</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Not a file drawer. Set a stretch, watch the ring ease closed, then optionally file the session as a public note with a Discord card.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.55 }} className="mt-10 flex flex-col items-center">
          <div className="relative grid h-52 w-52 place-items-center">
            <motion.div animate={{ scale: 0.86 + scale * 0.14 }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04]" />
            <p className="relative text-[42px] font-semibold tracking-[-0.05em]">{mm}:{ss}</p>
          </div>
          <div className="mt-6 flex gap-2">
            {[120, 240, 600].map((n) => (
              <button key={n} onClick={() => { setSeconds(n); setLeft(n); setRunning(false); }} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] text-white/80">{n / 60}m</button>
            ))}
          </div>
          <button onClick={() => setRunning((v) => !v)} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black">{running ? 'pause' : left === 0 ? 'again' : 'start'}</button>
        </motion.div>
        <div className="glass mt-8 rounded-3xl p-5">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="what the stretch was for" className="w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={publish} disabled={busy} className="mt-3 rounded-full bg-white/10 px-4 py-2 text-[13px] text-white">{busy ? 'filing…' : 'file the session'}</button>
          {embed && <p className="mt-3 truncate text-[13px] text-white/70">{embed}</p>}
        </div>
      </main>
    </div>
  );
}
