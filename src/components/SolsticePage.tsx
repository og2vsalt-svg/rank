import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function dayLengthHours(lat: number, doy: number) {
  const decl = 23.44 * Math.sin(((360 / 365) * (doy - 81) * Math.PI) / 180);
  const latR = (lat * Math.PI) / 180;
  const decR = (decl * Math.PI) / 180;
  const arg = -Math.tan(latR) * Math.tan(decR);
  const clamped = Math.min(1, Math.max(-1, arg));
  const ha = Math.acos(clamped);
  return (2 * ha * 24) / (2 * Math.PI);
}

function doyNow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((+now - +start) / 86400000);
}

export default function SolsticePage() {
  const [lat, setLat] = useState('51.5');
  const hours = useMemo(() => {
    const n = Number(lat);
    if (!Number.isFinite(n) || n < -90 || n > 90) return null;
    return dayLengthHours(n, doyNow());
  }, [lat]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">solstice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how long the light lasts today.</h1>
          <p className="text-neutral-400 text-sm mb-6">approximate daylight from latitude. stays on this device.</p>
          <label className="text-xs text-neutral-500 block mb-6">
            latitude
            <input value={lat} onChange={(e) => setLat(e.target.value)} className="mt-1 w-full bg-white/5 rounded-2xl px-4 py-3 text-white outline-none" />
          </label>
          <p className="text-5xl font-semibold tracking-tight">
            {hours == null ? '—' : hours.toFixed(2)}
            <span className="text-lg text-neutral-500 ml-2">hours</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
