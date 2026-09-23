import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

export default function FlumePage() {
  const { addFiles } = useVault();
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    if (!isLoggedIn) {
      navigate('login');
      return;
    }
    const total = [...list].reduce((n, f) => n + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'chunky drop. encoding might feel sleepy. still no cap.' : '');
    setPct(8);
    const tick = window.setInterval(() => setPct((p) => Math.min(88, p + 7)), 180);
    const res = await addFiles(list, 'inbox');
    window.clearInterval(tick);
    setPct(100);
    setMsg(res.ok ? `parked ${list.length} file${list.length > 1 ? 's' : ''} in the vault` : res.error || 'flume jammed');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">flume</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">watch the file slide in.</h1>
          <p className="text-neutral-400 text-sm mb-6">progress bar only. same vault, no extra limits, just a calmer drop.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">feed the flume</p>
          </label>
          <div className="mt-6 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full bg-[#0a84ff]" animate={{ width: pct + '%' }} transition={{ ease: [0.22, 1, 0.36, 1] }} />
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {msg && <p className="text-xs text-neutral-400 mt-3">{msg}</p>}
        </motion.div>
      </div>
    </div>
  );
}
