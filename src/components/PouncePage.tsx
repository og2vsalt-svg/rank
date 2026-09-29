import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function PouncePage() {
  const [lat, setLat] = useState(51.5);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const solar = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((+now - +start) / 86400000);
    const b = (2 * Math.PI * (day - 81)) / 365;
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    const decl = 23.44 * Math.sin((2 * Math.PI * (day - 81)) / 365);
    const noon = 12 - eot / 60;
    const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    const ha = (hour - noon) * 15;
    const alt = Math.asin(
      Math.sin((lat * Math.PI) / 180) * Math.sin((decl * Math.PI) / 180) +
        Math.cos((lat * Math.PI) / 180) * Math.cos((decl * Math.PI) / 180) * Math.cos((ha * Math.PI) / 180),
    );
    return {
      day,
      eot: eot.toFixed(1),
      decl: decl.toFixed(1),
      noon: `${Math.floor(noon)}:${String(Math.round((noon % 1) * 60)).padStart(2, '0')}`,
      altitude: ((alt * 180) / Math.PI).toFixed(1),
    };
  }, [lat, now]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">desk, not a vault</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pounce</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            a local solar clock. nothing uploads. set a latitude and watch equation of time drift through the day.
          </p>
          <label className="block text-xs text-neutral-500 mb-2">latitude</label>
          <input type="range" min={-66} max={66} step={0.5} value={lat} onChange={(e) => setLat(Number(e.target.value))} className="w-full accent-[#0a84ff]" />
          <p className="text-sm text-white mt-2 mb-8">{lat.toFixed(1)}°</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['solar noon', solar.noon],
              ['altitude', `${solar.altitude}°`],
              ['declination', `${solar.decl}°`],
              ['eq. of time', `${solar.eot} min`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                <p className="text-[11px] text-neutral-500 mb-1">{k}</p>
                <p className="text-lg text-white font-medium tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
