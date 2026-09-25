import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function PinnaclePage() {
  const { files, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('rankvault-pinnacle'));
  const [msg, setMsg] = useState('');

  const chosen = useMemo(() => files.find((f) => f.id === pin), [files, pin]);

  const setAsPin = async (id: string) => {
    setPin(id);
    localStorage.setItem('rankvault-pinnacle', id);
    const pub = await togglePublic(id);
    setMsg(pub.ok ? 'pinned and published. discord will unfurl /s/' + id : pub.error || 'pinned locally, cloud publish missed');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pinnacle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one file on the masthead.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick something already in the vault and make it the thing people land on. different from browsing the whole locker.</p>
          {chosen ? (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 mb-6">
              <p className="text-[11px] text-neutral-500 mb-1">current pinnacle</p>
              <p className="text-lg font-medium">{chosen.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{pretty(chosen.size)} · {chosen.type || 'file'}</p>
              <p className="text-xs text-neutral-500 mt-3 break-all">{shareUrls(chosen.id).embed}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate('share', chosen.id)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">open</button>
                <button
                  onClick={() => {
                    setPin(null);
                    localStorage.removeItem('rankvault-pinnacle');
                    setMsg('cleared');
                  }}
                  className="px-4 py-2 rounded-full bg-white/5 text-sm"
                >
                  clear
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mb-6">nothing pinned yet.</p>
          )}
          <div className="space-y-2">
            {files.slice(0, 24).map((f) => (
              <button
                key={f.id}
                onClick={() => setAsPin(f.id)}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] transition-colors flex items-center justify-between gap-3"
              >
                <span className="truncate text-sm">{f.name}</span>
                <span className="text-[11px] text-neutral-500 shrink-0">{pretty(f.size)}</span>
              </button>
            ))}
            {!files.length && <p className="text-sm text-neutral-500">vault is empty. drop a file first.</p>}
          </div>
          {msg && <p className="text-xs text-neutral-400 mt-5">{msg}</p>}
        </motion.div>
      </div>
    </div>
  );
}
