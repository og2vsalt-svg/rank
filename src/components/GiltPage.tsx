import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function GiltPage() {
  const { files, toggleStar, togglePublic } = useVault();
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [note, setNote] = useState('');

  const gilt = useMemo(() => files.filter((f) => f.starred), [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gilt</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">gold ribbon on the ones you keep.</h1>
          <p className="text-neutral-400 text-sm mb-6">not another vault. just the starred pile, ready to flip public without a size lock.</p>
          {!isLoggedIn ? (
            <button onClick={() => navigate('login')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">log in first</button>
          ) : gilt.length === 0 ? (
            <p className="text-sm text-neutral-500">star something in the vault and it shows up here.</p>
          ) : (
            <ul className="space-y-2">
              {gilt.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-[11px] text-neutral-500">{f.type || 'file'} · {Math.round(f.size / 1024)} kb</p>
                  </div>
                  <button onClick={() => toggleStar(f.id)} className="text-xs text-amber-300/90 px-3 py-1.5 rounded-full bg-white/5">unstick</button>
                  <button
                    onClick={async () => {
                      const res = await togglePublic(f.id);
                      setNote(res.ok ? shareUrls(f.id).app : res.error || 'could not publish');
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white text-black font-medium"
                  >
                    public link
                  </button>
                </li>
              ))}
            </ul>
          )}
          {note && <p className="text-xs text-neutral-400 mt-4 break-all">{note}</p>}
        </motion.div>
      </div>
    </div>
  );
}
