import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

export default function SundialPage() {
  const [lat, setLat] = useState(51.5);
  const [hour, setHour] = useState(new Date().getHours() + new Date().getMinutes() / 60);

  const shadow = useMemo(() => {
    const decl = 23.44 * Math.sin((2 * Math.PI * (new Date().getMonth() * 30 + new Date().getDate() - 81)) / 365);
    const hAng = (hour - 12) * 15;
    const alt =
      Math.sin((lat * Math.PI) / 180) * Math.sin((decl * Math.PI) / 180) +
      Math.cos((lat * Math.PI) / 180) * Math.cos((decl * Math.PI) / 180) * Math.cos((hAng * Math.PI) / 180);
    const elevation = (Math.asin(Math.max(-1, Math.min(1, alt))) * 180) / Math.PI;
    const length = elevation <= 0 ? 8 : Math.min(8, 1 / Math.tan((elevation * Math.PI) / 180));
    return { elevation, length };
  }, [lat, hour]);

  const hh = Math.floor(hour);
  const mm = Math.round((hour - hh) * 60);

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
          <p className="text-[#0a84ff] text-sm mb-2">sundial</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet noon-stick. nothing leaves this tab.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. pick a latitude and an hour, watch the gnomon stretch. useful when you just need a sense of light.
          </p>
          <div className="relative h-56 rounded-[28px] bg-black/30 overflow-hidden mb-6">
            <motion.div
              className="absolute left-1/2 bottom-8 w-1.5 h-16 rounded-full bg-white/80 origin-bottom"
              style={{ x: '-50%' }}
            />
            <motion.div
              className="absolute left-1/2 bottom-8 h-1 rounded-full bg-[#0a84ff]/70 origin-left"
              animate={{ width: `${Math.min(220, shadow.length * 28)}px`, rotate: (hour - 12) * 12 }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              style={{ x: '-2px' }}
            />
          </div>
          <label className="block text-xs text-neutral-500 mb-2">latitude {lat.toFixed(1)}°</label>
          <input type="range" min={-66} max={66} step={0.5} value={lat} onChange={(e) => setLat(Number(e.target.value))} className="w-full mb-5" />
          <label className="block text-xs text-neutral-500 mb-2">hour {pad(hh)}:{pad(mm)}</label>
          <input type="range" min={5} max={20} step={0.05} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full" />
          <p className="text-sm text-neutral-300 mt-6">
            sun altitude ≈ {shadow.elevation.toFixed(1)}°. {shadow.elevation <= 0 ? 'below the horizon.' : 'gnomon still throws a shadow.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
