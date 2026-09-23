import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function AxisPage() {
  const { files } = useVault();
  const stats = useMemo(() => {
    const total = files.length;
    const bytes = files.reduce((a, f: any) => a + (Number(f.size) || 0), 0);
    const pubs = files.filter((f: any) => f.public).length;
    const types: Record<string, number> = {};
    for (const f of files as any[]) {
      const t = String(f.type || f.mime || 'unknown').split('/')[0] || 'unknown';
      types[t] = (types[t] || 0) + 1;
    }
    const ranked = Object.entries(types).sort((a, b) => b[1] - a[1]);
    return { total, bytes, pubs, ranked };
  }, [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">axis</p>
          <h1 className="text-3xl font-semibold mb-3">a read on the pile.</h1>
          <p className="text-neutral-400 text-sm mb-8">counts only. no file cap. if the pile is huge the tab might breathe for a second.</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[['files', String(stats.total)], ['public', String(stats.pubs)], ['mb', (stats.bytes / (1024 * 1024)).toFixed(1)]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/[0.04] px-4 py-5">
                <p className="text-[11px] text-neutral-500 mb-1">{k}</p>
                <p className="text-2xl font-semibold tracking-tight">{v}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {stats.ranked.map(([k, n]) => (
              <li key={k} className="flex items-center gap-3">
                <span className="w-20 text-xs text-neutral-400">{k}</span>
                <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full bg-[#0a84ff] rounded-full" style={{ width: `${Math.max(8, (n / Math.max(stats.total, 1)) * 100)}%` }} />
                </div>
                <span className="text-xs text-neutral-500 w-8 text-right">{n}</span>
              </li>
            ))}
            {!stats.ranked.length && <p className="text-sm text-neutral-500">vault is empty on this device.</p>}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
