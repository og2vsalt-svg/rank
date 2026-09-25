import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function RipplePage() {
  const vault = useVault() as any;
  const { navigate } = useRouter();
  const files = vault.files || vault.items || [];
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = Array.isArray(files) ? files : [];
    const needle = q.trim().toLowerCase();
    return list
      .filter((f: any) => !needle || String(f.name || f.filename || '').toLowerCase().includes(needle))
      .slice(0, 40);
  }, [files, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ripple</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">skim recent drops without opening the vault grid.</h1>
          <p className="text-neutral-400 text-sm mb-6">search names, copy discord embeds, jump to share pages. files stay unlimited.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name"
            className="w-full mb-5 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <div className="space-y-2">
            {rows.length === 0 && <p className="text-sm text-neutral-500">nothing in session yet. drop from vestibule or lintel first.</p>}
            {rows.map((f: any) => {
              const id = f.id || f.shareId;
              const urls = id ? shareUrls(id) : null;
              return (
                <div key={id || f.name} className="rounded-2xl bg-white/[0.04] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{f.name || f.filename || 'file'}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{urls?.embed || 'local only'}</p>
                  </div>
                  {id && (
                    <button onClick={() => navigate('share', id)} className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15">open</button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
