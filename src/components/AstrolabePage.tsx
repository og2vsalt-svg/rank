import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function declination(dayOfYear: number) {
  return -23.44 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365);
}

export default function AstrolabePage() {
  const [lat, setLat] = useState(51.5);
  const [hour, setHour] = useState(new Date().getHours() + new Date().getMinutes() / 60);

  const day = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    return Math.floor((Date.now() - start.getTime()) / 86400000);
  }, []);

  const dec = declination(day);
  const ha = (hour - 12) * 15;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const alt =
    (Math.asin(
      Math.sin(toRad(lat)) * Math.sin(toRad(dec)) +
        Math.cos(toRad(lat)) * Math.cos(toRad(dec)) * Math.cos(toRad(ha)),
    ) *
      180) /
    Math.PI;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">astrolabe</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how high is the sun from where you sit.</h1>
          <p className="text-neutral-400 text-sm mb-8">
            a rough altitude. good enough to know if the desk is in shade. no files involved.
          </p>
          <p className="text-6xl font-semibold tracking-tight tabular-nums mb-1">{alt.toFixed(1)}°</p>
          <p className="text-neutral-500 text-sm mb-8">solar altitude · day {day}</p>
          <label className="block text-xs text-neutral-500 mb-2">latitude {lat.toFixed(1)}°</label>
          <input
            type="range"
            min={-66}
            max={66}
            step={0.1}
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            className="w-full accent-[#0a84ff] mb-5"
          />
          <label className="block text-xs text-neutral-500 mb-2">local hour {hour.toFixed(1)}</label>
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full accent-[#0a84ff]"
          />
        </motion.div>
      </div>
    </div>
  );
}
