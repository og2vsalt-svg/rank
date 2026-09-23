import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

export default function KnollPage() {
  const { files } = useVault();
  const { navigate } = useRouter();
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const map = new Map<string, typeof files>();
    for (const f of files) {
      const key = (f.type || 'file').split('/')[0] || 'file';
      const arr = map.get(key) || [];
      arr.push(f);
      map.set(key, arr);
    }
    const term = q.trim().toLowerCase();
    return [...map.entries()]
      .map(([k, list]) => [k, term ? list.filter((f) => f.name.toLowerCase().includes(term)) : list] as const)
      .filter(([, list]) => list.length);
  }, [files, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#0a84ff] text-sm mb-2">knoll</p>
          <h1 className="text-3xl font-semibold mb-3">little piles by type.</h1>
          <p className="text-neutral-400 text-sm mb-6">same vault, just grouped so it feels less like a junk drawer.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter names" className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none mb-6" />
          <div className="space-y-6">
            {groups.map(([kind, list]) => (
              <div key={kind} className="glass rounded-[28px] p-6">
                <p className="text-white font-medium mb-3">{kind} · {list.length}</p>
                <div className="space-y-2">
                  {list.slice(0, 12).map((f) => (
                    <button key={f.id} onClick={() => navigate('share', f.id)} className="w-full text-left text-sm text-neutral-400 hover:text-white truncate">
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!groups.length && <p className="text-sm text-neutral-500">vault is empty or nothing matches.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
