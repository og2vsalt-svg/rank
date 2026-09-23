import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function WicketPage() {
  const { files } = useVault();
  const [id, setId] = useState(files[0]?.id || '');
  const [copied, setCopied] = useState('');

  const urls = useMemo(() => (id ? shareUrls(id) : null), [id]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied('could not copy');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">wicket</p>
          <h1 className="text-3xl font-semibold mb-3">every door for a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">app link, discord embed path, short aliases. pick a vault file.</p>
          <select value={id} onChange={(e) => setId(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none mb-6">
            <option value="">choose a file</option>
            {files.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          {urls && (
            <div className="space-y-3 text-sm">
              {[
                ['app', urls.app],
                ['embed', urls.embed],
                ['discord', urls.embed],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 bg-white/5 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-neutral-500 text-xs">{label}</p>
                    <p className="truncate text-neutral-200">{value}</p>
                  </div>
                  <button onClick={() => copy(label, value)} className="shrink-0 text-[#0a84ff] text-xs">copy</button>
                </div>
              ))}
              {copied && <p className="text-xs text-neutral-500">copied {copied}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
