import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const ZONES = [
  { label: 'london', tz: 'Europe/London' },
  { label: 'new york', tz: 'America/New_York' },
  { label: 'los angeles', tz: 'America/Los_Angeles' },
  { label: 'tokyo', tz: 'Asia/Tokyo' },
  { label: 'sydney', tz: 'Australia/Sydney' },
  { label: 'utc', tz: 'UTC' },
];

function fmt(now: Date, tz: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(now);
  } catch {
    return now.toISOString();
  }
}

export default function SpirePage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 sm:p-10"
        >
          <p className="text-[#0a84ff] text-sm mb-2">spire</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">six clocks on one quiet tower.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. just the hour in a few cities, ticking in the tab.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ZONES.map((z, i) => (
              <motion.div
                key={z.tz}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[22px] bg-white/[0.03] border border-white/5 px-5 py-4"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{z.label}</p>
                <p className="text-lg text-white mt-1 font-medium tabular-nums">{fmt(now, z.tz)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
