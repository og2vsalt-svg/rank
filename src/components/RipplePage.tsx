import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function RipplePage() {
  const events = useMemo(() => {
    const drops = JSON.parse(localStorage.getItem('rank_public_shares') || '[]');
    const caps = JSON.parse(localStorage.getItem('rank_capsules') || '[]');
    const havens = JSON.parse(localStorage.getItem('rank_havens') || '[]');
    return [
      ...drops.map((d: any) => ({ t: d.createdAt || 0, kind: 'drop', label: d.name || d.id })),
      ...caps.map((d: any) => ({ t: d.createdAt || 0, kind: 'capsule', label: d.name })),
      ...havens.map((d: any) => ({ t: d.createdAt || 0, kind: 'haven', label: d.name })),
    ].sort((a, b) => b.t - a.t).slice(0, 40);
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ripple</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">quiet activity.</h1>
          <p className="text-neutral-400 text-sm mb-6">a local feed of drops, capsules, and havens. no analytics circus. just what happened on this device.</p>
          <div className="space-y-3">
            {events.length === 0 && <p className="text-sm text-neutral-500">nothing yet. share a file or seal a capsule.</p>}
            {events.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#0a84ff]" />
                <div>
                  <p className="text-sm text-white">{e.label}</p>
                  <p className="text-[11px] text-neutral-500">{e.kind} · {e.t ? new Date(e.t).toLocaleString() : 'now'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
