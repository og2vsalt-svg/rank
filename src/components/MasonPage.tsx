import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function MasonPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [info, setInfo] = useState<{ name: string; type: string; size: number; last: string } | null>(null);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setInfo({ name: f.name, type: f.type || 'unknown', size: f.size, last: new Date(f.lastModified).toISOString() });
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. encoding might feel slow. no hard cap.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not keep it');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (pub.ok) setLink(shareUrls(id).app);
      else setErr(pub.error || 'kept locally, cloud skipped');
    } catch (e: any) {
      setErr(e?.message || 'mason failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mason</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the stone, then set it out.</h1>
          <p className="text-neutral-400 text-sm mb-6">inspect a local file first. if you want, it still goes to the vault and the public share db.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-10 text-center transition-all duration-300" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'setting the stone…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no limit. just a slowness note if it is huge.</p>
          </label>
          {info && (
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">name</p><p className="truncate">{info.name}</p></div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">type</p><p className="truncate">{info.type}</p></div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">size</p><p>{pretty(info.size)}</p></div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">modified</p><p className="truncate text-xs">{info.last}</p></div>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">{link}</p>}
          <div className="mt-6 flex gap-2">
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">vault</button>
            <button onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">drop</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
