import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function AmberPage() {
  const { files } = useVault() as any;

  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    (files || []).forEach((f: any) => {
      const key = `${(f.name || '').toLowerCase()}::${f.size || 0}`;
      const list = map.get(key) || [];
      list.push(f);
      map.set(key, list);
    });
    return [...map.values()].filter((g) => g.length > 1);
  }, [files]);

  const huge = (files || []).some((f: any) => (f.size || 0) > 80 * 1024 * 1024);

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
          <p className="text-[#0a84ff] text-sm mb-2">amber</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">catch the twins.</h1>
          <p className="text-neutral-400 text-sm mb-6">same name and size in this vault, grouped so you can clean the pile. stays on device.</p>
          {huge && <p className="text-xs text-amber-300/80 mb-4">chunky files in here. listing is fine, previews might hitch.</p>}
          {groups.length === 0 && <p className="text-sm text-neutral-500">no obvious duplicates. nice.</p>}
          <ul className="space-y-3">
            {groups.map((g, i) => (
              <li key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-white text-sm truncate">{g[0].name}</p>
                <p className="text-xs text-neutral-500 mb-2">{g.length} copies · {(g[0].size / 1024).toFixed(1)} kb</p>
                {g.map((f: any) => (
                  <p key={f.id} className="text-xs text-neutral-400 truncate">{f.id}</p>
                ))}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
