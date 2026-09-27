import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function VelvetPage() {
  const { files, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const recent = useMemo(() => files.slice(0, 12), [files]);

  const publish = async (id: string) => {
    setBusyId(id);
    setNote('');
    try {
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setNote(pub.error || 'publish missed');
        return;
      }
      const urls = shareUrls(id);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      setNote('embed copied — paste in discord for the pro card');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">velvet</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">queue from the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">not another vault. pick something you already have and flip it public with a discord-ready /s link.</p>
          {recent.length === 0 && <p className="text-sm text-neutral-500">vault is empty. drop something first.</p>}
          <div className="space-y-2">
            {recent.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-[11px] text-neutral-500">{f.type || 'file'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate('share', f.id)} className="text-[12px] text-neutral-300 px-3 py-1.5 rounded-full hover:bg-white/5">open</button>
                  <button onClick={() => publish(f.id)} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-white text-black">
                    {busyId === f.id ? '…' : 'publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {note && <p className="text-xs text-neutral-400 mt-4">{note}</p>}
        </motion.div>
      </div>
    </div>
  );
}
