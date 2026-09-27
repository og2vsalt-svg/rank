import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

export default function RidgePage() {
  const { files } = useVault();
  const { navigate } = useRouter();
  const rows = useMemo(() => files.slice(0, 24), [files]);
  const max = Math.max(1, ...rows.map((f: any) => Number(f.size) || 0));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ridge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">see the skyline of what you keep.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. just a quiet graph of file weight so you know what is heavy before you share.</p>
          {rows.length === 0 ? (
            <p className="text-neutral-500 text-sm">nothing in the vault yet. drop something first.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((f: any, i: number) => (
                <motion.div key={f.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3">
                  <p className="w-36 truncate text-xs text-neutral-400">{f.name}</p>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(4, ((Number(f.size) || 0) / max) * 100)}%`, transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="mt-8 flex gap-2">
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open vault</button>
            <button onClick={() => navigate('mason')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">mason</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
