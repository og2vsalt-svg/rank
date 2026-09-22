import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function PinnaclePage() {
  const { files } = useVault() as any;
  const stats = useMemo(() => {
    const list = files || [];
    const total = list.reduce((a: number, f: any) => a + (Number(f.size) || 0), 0);
    const pub = list.filter((f: any) => f.public || f.isPublic).length;
    const types = new Set(list.map((f: any) => (f.type || 'file').split('/')[0]));
    return { n: list.length, total, pub, types: types.size };
  }, [files]);

  const sleepy = stats.total > 80 * 1024 * 1024;

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
          <p className="text-[#0a84ff] text-sm mb-2">pinnacle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet readout.</h1>
          <p className="text-neutral-400 text-sm mb-6">counts only. no caps. just how heavy this tab is feeling.</p>
          {sleepy && <p className="text-xs text-amber-300/80 mb-4">this vault is getting chunky. previews may feel slow.</p>}
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'files', v: String(stats.n) },
              { k: 'bytes', v: (stats.total / 1024).toFixed(1) + ' kb' },
              { k: 'public-ish', v: String(stats.pub) },
              { k: 'kinds', v: String(stats.types) },
            ].map((c) => (
              <motion.div
                key={c.k}
                whileHover={{ y: -2 }}
                className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-5"
              >
                <p className="text-xs text-neutral-500 mb-1">{c.k}</p>
                <p className="text-xl text-white tracking-tight">{c.v}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
