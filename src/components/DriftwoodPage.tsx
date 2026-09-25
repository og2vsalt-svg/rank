import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function DriftwoodPage() {
  const { addFiles, togglePublic } = useVault();
  const [hold, setHold] = useState(8);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    if (file.size > 40 * 1024 * 1024) setWarn('heavy drop. encoding might feel sleepy. no hard cap.');
    else setWarn('');
    setErr('');
    setLink('');
    setBusy(true);
    let remaining = Math.max(0, hold);
    setLeft(remaining);
    await new Promise<void>((resolve) => {
      const t = setInterval(() => {
        remaining -= 1;
        setLeft(Math.max(0, remaining));
        if (remaining <= 0) {
          clearInterval(t);
          resolve();
        }
      }, 1000);
      if (remaining <= 0) {
        clearInterval(t);
        resolve();
      }
    });
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not park the file');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud publish missed');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed || urls.app);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'driftwood failed');
    } finally {
      setBusy(false);
      setLeft(0);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">driftwood</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hold a file, then let it drift public.</h1>
          <p className="text-neutral-400 text-sm mb-6">a pause before the share db. pick seconds, drop a local file, wait, then get the discord /s card.</p>
          <label className="block text-xs text-neutral-400 mb-5">
            hold {hold}s
            <input type="range" min={0} max={30} value={hold} onChange={(e) => setHold(Number(e.target.value))} className="w-full mt-2" />
          </label>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? (left > 0 ? `holding ${left}s…` : 'publishing…') : 'click or drop a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. just a slowness warning if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
