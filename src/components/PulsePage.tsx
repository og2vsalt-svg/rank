import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

export default function PulsePage() {
  const vault = useVault() as any;
  const { navigate } = useRouter();
  const files = vault.files || vault.items || [];
  const stats = useMemo(() => {
    const list = Array.isArray(files) ? files : [];
    const total = list.length;
    const bytes = list.reduce((a: number, f: any) => a + (Number(f.size) || 0), 0);
    const pub = list.filter((f: any) => f.isPublic || f.public).length;
    return { total, bytes, pub };
  }, [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pulse</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet heartbeat of what you hold.</h1>
          <p className="text-sm text-neutral-400 mb-8">counts only. no boosting, no ranks, no fake heat. just how heavy the tab is.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: 'files', v: String(stats.total) },
              { k: 'public', v: String(stats.pub) },
              { k: 'mb', v: (stats.bytes / 1024 / 1024).toFixed(1) },
            ].map((c) => (
              <motion.div key={c.k} whileHover={{ y: -2 }} className="rounded-3xl bg-white/[0.04] border border-white/5 p-4 text-center">
                <p className="text-2xl font-semibold text-white tabular-nums">{c.v}</p>
                <p className="text-xs text-neutral-500 mt-1">{c.k}</p>
              </motion.div>
            ))}
          </div>
          <button onClick={() => navigate('vault')} className="mt-8 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open vault</button>
        </motion.div>
      </div>
    </div>
  );
}
