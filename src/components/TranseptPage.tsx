import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const CITIES = [
  { city: 'London', zone: 'Europe/London' },
  { city: 'New York', zone: 'America/New_York' },
  { city: 'Tokyo', zone: 'Asia/Tokyo' },
  { city: 'Lisbon', zone: 'Europe/Lisbon' },
];

function clock(zone: string, now: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

export default function TranseptPage() {
  const [now, setNow] = useState(() => new Date());
  const [note, setNote] = useState('crossing the nave, not filing a drawer');

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const local = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now),
    [now],
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">transept</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a crossing of clocks</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            This room does not store files. It keeps the hour in four cities so a shared drop can be timed against somewhere else.
          </p>
          <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-white">{local}</p>
        </motion.div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {CITIES.map((c, i) => (
            <motion.div
              key={c.city}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl p-5"
            >
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">{c.city}</p>
              <p className="mt-2 font-mono text-[28px] tracking-tight">{clock(c.zone, now)}</p>
            </motion.div>
          ))}
        </div>
        <label className="mt-6 block text-[13px] text-white/45">
          margin note, stays in this tab
          <input value={note} onChange={(e) => setNote(e.target.value)} className="glass mt-2 w-full rounded-2xl px-4 py-3 text-[14px] text-white outline-none" />
        </label>
      </main>
    </div>
  );
}
