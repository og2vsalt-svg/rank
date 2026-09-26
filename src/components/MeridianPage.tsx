import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function MeridianPage() {
  const [hours, setHours] = useState(24);
  const iso = useMemo(() => new Date(Date.now() + hours * 3600 * 1000).toISOString(), [hours]);
  const local = useMemo(() => new Date(iso).toLocaleString(), [iso]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meridian</p>
          <h1 className="text-3xl font-semibold mb-3">pick an expiry without the math</h1>
          <p className="text-neutral-400 text-sm mb-6">copy the iso stamp into sundial or any share lock. files themselves stay unlimited.</p>
          <input type="range" min={1} max={336} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full" />
          <p className="mt-4 text-sm text-white">{hours} hours from now</p>
          <p className="text-neutral-400 text-sm mt-1">{local}</p>
          <button onClick={() => navigator.clipboard.writeText(iso)} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy iso</button>
          <p className="text-xs text-neutral-500 mt-3 break-all">{iso}</p>
        </motion.div>
      </div>
    </div>
  );
}
