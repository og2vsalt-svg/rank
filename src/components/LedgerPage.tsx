import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function LedgerPage() {
  const { files } = useVault();
  const { navigate } = useRouter();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return files
      .slice()
      .sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .filter((f: any) => !needle || String(f.name || '').toLowerCase().includes(needle) || String(f.id || '').includes(needle));
  }, [files, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ledger</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet list of what you kept.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault grid. just names, sizes, and a discord-ready link if the file is public.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-6"
          />
          <div className="space-y-2">
            {rows.map((f: any) => {
              const urls = shareUrls(f.id);
              return (
                <div key={f.id} className="rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-[11px] text-neutral-500">{f.isPublic ? 'public' : 'private'} · {f.type || 'file'}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate('share', f.id)} className="text-[12px] px-3 py-1.5 rounded-full bg-white/8">open</button>
                    {f.isPublic && (
                      <button
                        onClick={() => navigator.clipboard.writeText(urls.embed)}
                        className="text-[12px] px-3 py-1.5 rounded-full bg-white text-black"
                      >
                        copy /s/
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!rows.length && <p className="text-sm text-neutral-500">empty ledger. drop something first.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
