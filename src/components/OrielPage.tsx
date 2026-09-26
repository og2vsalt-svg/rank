import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function OrielPage() {
  const { addFiles, togglePublic } = useVault();
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview('');
    }
    setWarn(file.size > 40 * 1024 * 1024 ? 'big still. preview might stutter. no cap.' : '');
    setErr('');
    setEmbed('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'publish failed');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'oriel failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">oriel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">frame a still, then ship it.</h1>
          <p className="text-neutral-400 text-sm mb-6">window seat for one image. public drop + discord card. not a vault grid.</p>
          {preview && (
            <div className="mb-6 rounded-[28px] overflow-hidden border border-white/10 bg-black/40">
              <img src={preview} alt="" className="w-full max-h-80 object-contain" />
            </div>
          )}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'framing…' : 'drop a still'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">embed copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
