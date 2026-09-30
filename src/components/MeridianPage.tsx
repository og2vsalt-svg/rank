import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const ZONES = [
  'Pacific/Honolulu',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Helsinki',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function fmt(date: Date, zone: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}

export default function MeridianPage() {
  const [stamp, setStamp] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const date = useMemo(() => {
    const raw = new Date(stamp);
    return Number.isNaN(+raw) ? new Date() : raw;
  }, [stamp]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">meridian</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">the same instant, many cities.</h1>
          <p className="text-neutral-400 text-sm mb-6">a clock desk. useful when a drop goes live and you want the hour in another room.</p>
          <input
            type="datetime-local"
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
            className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 mb-6"
          />
          <div className="space-y-1.5">
            {ZONES.map((z) => (
              <div key={z} className="flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 hover:bg-white/5">
                <span className="text-sm text-neutral-300">{z.replace(/_/g, ' ')}</span>
                <span className="text-sm text-neutral-500 tabular-nums">{fmt(date, z)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
