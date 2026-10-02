import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function CleatPage() {
  const [bpm, setBpm] = useState(84);
  const [on, setOn] = useState(false);
  const [beats, setBeats] = useState(0);
  const [accent, setAccent] = useState(4);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');
  const ctx = useRef<AudioContext | null>(null);
  const timer = useRef<number | null>(null);
  const beatRef = useRef(0);

  const pulse = useMemo(() => (on ? 60000 / bpm : 0), [on, bpm]);

  useEffect(() => {
    if (!on) {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      return;
    }
    const tick = () => {
      const audio = ctx.current || new AudioContext();
      ctx.current = audio;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      beatRef.current += 1;
      const beat = beatRef.current;
      osc.frequency.value = beat % accent === 1 ? 880 : 520;
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.1);
      setBeats(beat);
    };
    tick();
    timer.current = window.setInterval(tick, pulse);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [on, pulse, accent]);

  const fileSession = async () => {
    setBusy(true);
    setError('');
    const body = `cleat session\nbpm ${bpm}\naccent every ${accent}\nbeats counted ${beats}\n${note.trim()}\n`;
    const file = new File([body], 'cleat-session.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: `cleat · ${bpm} bpm`, color: '#0A84FF' });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'the session did not land');
      return;
    }
    setCard(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">cleat</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A tempo, not a drawer.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Tap a click in the tab. Filing the session writes a small text note into the share table so Discord can unfurl it. Nothing is cut for size.</p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-end justify-between">
            <p className="text-6xl font-semibold tracking-tight text-white tabular-nums">{bpm}</p>
            <p className="text-sm text-zinc-500">{beats} beats</p>
          </div>
          <input type="range" min={40} max={200} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="mt-4 w-full accent-[#0A84FF]" />
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setOn((v) => !v)} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200">{on ? 'stop' : 'start'}</button>
            <label className="text-sm text-zinc-400">accent
              <input type="number" min={1} max={12} value={accent} onChange={(e) => setAccent(Math.max(1, Number(e.target.value) || 1))} className="ml-2 w-16 rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-zinc-100" />
            </label>
            <button onClick={() => { beatRef.current = 0; setBeats(0); }} className="text-sm text-zinc-500">reset</button>
          </div>
          <motion.div animate={{ scale: on ? [1, 1.04, 1] : 1 }} transition={{ duration: pulse / 1000 || 0.7, repeat: on ? Infinity : 0 }} className="mt-6 h-2 rounded-full bg-[#0A84FF]/70" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what you were keeping time for" className="mt-5 h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <button disabled={busy} onClick={fileSession} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40">{busy ? 'filing…' : 'file the session'}</button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {card && <a className="mt-3 block text-sm text-[#7ab8ff] underline" href={card}>{card}</a>}
        </motion.div>
      </main>
    </div>
  );
}
