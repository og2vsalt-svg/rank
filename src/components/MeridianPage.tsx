import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function MeridianPage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const stamp = useMemo(() => {
    const now = new Date();
    const zones = [
      'UTC',
      'America/Los_Angeles',
      'America/New_York',
      'Europe/London',
      'Europe/Berlin',
      'Asia/Tokyo',
    ];
    return zones.map((z) => ({
      z,
      t: now.toLocaleString('en-GB', { timeZone: z, hour12: false }),
    }));
  }, [name, size]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meridian</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a drop across timezones.</h1>
          <p className="text-sm text-neutral-400 mb-6">not a vault. just a receipt clock so you know when the file actually hit the tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition-all duration-300">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setName(f.name);
                setSize(f.size);
              }}
            />
            <p className="text-white font-medium">{name || 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. huge files just make the picker feel sleepy.</p>
          </label>
          {name && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-500">{name} · {(size / 1024 / 1024).toFixed(2)} mb</p>
              {stamp.map((s) => (
                <div key={s.z} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                  <span className="text-sm text-neutral-300">{s.z}</span>
                  <span className="text-sm text-white tabular-nums">{s.t}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
