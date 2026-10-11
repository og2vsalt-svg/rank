import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CascadePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const big = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. cascade may feel slow. no hard limits.' : '');
    setBusy(true);
    const newLinks: string[] = [];
    try {
      await addFiles(files, 'cascade');
      for (const file of files.slice(0, 5)) {
        const res = await publishLocalFile(file, {
          caption: 'cascade',
          color: '#30D158',
        });
        if (res.ok && res.id) {
          newLinks.push(shareUrls(res.id).app);
        }
      }
      setLinks(newLinks);
      if (newLinks[0]) {
        try { await navigator.clipboard.writeText(newLinks[0]); } catch {}
      }
    } catch (e: any) {
      setWarn(e?.message || 'cascade failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 115, damping: 16 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#30D158] text-sm font-medium mb-2 tracking-wide">cascade</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a stream of files.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            Multiple local files into the vault and public shares. Each gets a professional Discord embed. Springy, human-crafted motion.
          </p>

          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#30D158]/50 p-12 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium text-lg">{busy ? 'cascading…' : 'click or drop files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size limits · only slowness warnings</p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}

          {links.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400">shares created (first copied):</p>
              {links.map((l) => (
                <p key={l} className="text-xs break-all text-neutral-300">{l}</p>
              ))}
              <button onClick={() => navigate('vault')} className="mt-3 px-5 py-2 rounded-full bg-white text-black text-sm">
                view vault
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
