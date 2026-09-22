import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

function fmt(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SiloPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFiles, files } = useVault();
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(0);

  const onPick = async (list: FileList | null) => {
    if (!list || !list.length) return;
    if (!isLoggedIn) {
      navigate('login');
      return;
    }
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'big batch. the tab may feel slow while it lands. no hard cap though.' : '');
    setBusy(true);
    try {
      await addFiles(arr);
      setLast(arr.length);
    } finally {
      setBusy(false);
    }
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">silo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">dump a pile at once.</h1>
          <p className="text-neutral-400 text-sm mb-6">bulk drop into the vault. no file limit. just a heads up if the batch is chunky.</p>

          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-full rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-white text-sm">{busy ? 'landing files…' : 'click or drop a whole folder vibe'}</p>
            <p className="text-xs text-neutral-500 mt-2">{files.length} already in vault</p>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          {warn && <p className="text-xs text-amber-400/80 mt-4">{warn}</p>}
          {last > 0 && <p className="text-xs text-neutral-500 mt-3">last batch: {last} file{last === 1 ? '' : 's'}</p>}
          <div className="mt-6 flex gap-2">
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open vault</button>
            <button onClick={() => navigate('halo')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">share health</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
