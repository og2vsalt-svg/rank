import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function VaultlightPage() {
  const { files, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  const lights = files.slice(0, 16);

  const copyEmbed = async (id: string) => {
    const urls = shareUrls(id);
    try {
      await navigator.clipboard.writeText(urls.embed);
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 28 }} className="mb-10">
          <p className="text-[#0a84ff] text-sm mb-1">vaultlight</p>
          <h1 className="text-4xl font-semibold tracking-tight">every share lights a card.</h1>
          <p className="text-neutral-400 mt-2 max-w-xl">files stay in the vault. one tap copies the Discord-ready link. no hard limits — only the soft note when a drop is heavy.</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {lights.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025, type: 'spring', stiffness: 300, damping: 24 }}
              className="glass rounded-[24px] overflow-hidden group"
            >
              {f.type.startsWith('image/') ? (
                <img src={f.url} alt="" className="h-32 w-full object-cover group-hover:scale-[1.04] transition duration-500" />
              ) : (
                <div className="h-32 grid place-items-center text-xs text-neutral-500 px-2 text-center">{f.name}</div>
              )}
              <div className="p-3 flex items-center justify-between gap-2">
                <button onClick={() => navigate('share', f.id)} className="text-xs truncate text-left flex-1">{f.name}</button>
                <button onClick={() => copyEmbed(f.id)} className="text-[11px] text-[#0a84ff] shrink-0">{copied === f.id ? 'copied' : 'embed'}</button>
              </div>
            </motion.div>
          ))}
        </div>

        {lights.length === 0 && (
          <div className="glass rounded-[28px] p-12 text-center text-neutral-500 text-sm mt-6">vault is quiet. drop a file and it will light up here.</div>
        )}

        <div className="mt-10 flex justify-center gap-3">
          <button onClick={() => navigate('drop')} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium">drop a file</button>
          <button onClick={() => navigate('sharehub')} className="px-6 py-2.5 rounded-full bg-white/5 text-sm">shares</button>
        </div>
      </div>
    </div>
  );
}
