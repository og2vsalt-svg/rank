import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

export default function YarrowPage() {
  const { addFiles } = useVault();
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [prefix, setPrefix] = useState('drop-');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    if (!isLoggedIn) {
      setMsg('sign in first');
      return;
    }
    setBusy(true);
    setMsg('');
    const renamed = [...list].map((f, i) => {
      const ext = f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.')) : '';
      const n = `${prefix}${String(i + 1).padStart(2, '0')}${ext}`;
      return new File([f], n, { type: f.type });
    });
    const biggest = Math.max(...renamed.map((f) => f.size));
    setWarn(biggest > 40 * 1024 * 1024 ? 'some of these are chunky — encoding might feel slow.' : '');
    const res = await addFiles(renamed);
    setBusy(false);
    if (!res.ok) setMsg(res.error || 'could not save');
    else setMsg(`saved ${res.ids?.length || 0} files with the new names`);
    if (res.warn) setWarn(res.warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">yarrow</p>
          <h1 className="text-3xl font-semibold mb-3">rename on the way in.</h1>
          <p className="text-neutral-400 text-sm mb-6">batch prefix before they land in the vault. still no size cap.</p>
          <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none mb-4" placeholder="prefix" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'saving…' : 'pick files'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
          <button onClick={() => navigate('vault')} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open vault</button>
        </motion.div>
      </div>
    </div>
  );
}
