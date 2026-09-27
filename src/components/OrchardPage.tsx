import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

function ext(name: string) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : 'none';
}

export default function OrchardPage() {
  const { files } = useVault();
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const f of files) {
      const key = ext(f.name || '');
      if (q && !String(f.name).toLowerCase().includes(q.toLowerCase()) && !key.includes(q.toLowerCase())) continue;
      (map[key] ||= []).push(f);
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [files, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">orchard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sort the trees, not the fruit.</h1>
          <p className="text-neutral-400 text-sm mb-6">groups vault files by extension so you can wander by kind instead of one long list.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter by name or type" className="w-full mb-6 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          <div className="space-y-4">
            {groups.map(([kind, list]) => (
              <div key={kind} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-sm text-white mb-2">{kind} · {list.length}</p>
                <div className="flex flex-wrap gap-2">
                  {list.slice(0, 12).map((f: any) => (
                    <button key={f.id} onClick={() => navigate('share', f.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 transition">{f.name}</button>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="text-sm text-neutral-500">empty orchard. drop files first.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
