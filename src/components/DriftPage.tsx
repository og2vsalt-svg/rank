import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function DriftPage() {
  const [hours, setHours] = useState(24);
  const [now] = useState(() => Date.now());
  const expires = useMemo(() => new Date(now + hours * 60 * 60 * 1000), [hours, now]);
  const iso = expires.toISOString();

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
          <p className="text-[#0a84ff] text-sm mb-2">drift</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how long a drop should stay awake.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a clock for expiry, not a vault. copy the timestamp into any share desk that accepts expiresAt.
          </p>
          <input
            type="range"
            min={1}
            max={720}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full accent-[#0a84ff]"
          />
          <p className="text-sm text-white mt-4">{hours} hour{hours === 1 ? '' : 's'}</p>
          <p className="text-neutral-400 text-sm mt-1">{expires.toLocaleString()}</p>
          <button
            onClick={() => navigator.clipboard.writeText(iso).catch(() => {})}
            className="mt-5 px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm hover:bg-white/12 transition-colors"
          >
            copy iso
          </button>
          <p className="text-[11px] text-neutral-500 mt-3 break-all font-mono">{iso}</p>
        </motion.div>
      </div>
    </div>
  );
}
