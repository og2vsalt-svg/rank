import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function NimbusPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [stamp, setStamp] = useState(() => new Date().toISOString().slice(0, 16));

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. tab might nap while it encodes. no cap.' : '');
    setErr('');
    setLink('');
    setEmbed('');
    setBusy(true);
    try {
      const stamped = new File([file], `${stamp.replace(/[:T]/g, '-')}-${file.name}`, { type: file.type });
      const dt = new DataTransfer();
      dt.items.add(stamped);
      const result = await addFiles(dt.files, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save');
        return;
      }
      const id = result.ids?.[0];
      if (!id) {
        setErr('saved but no id');
        return;
      }
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'cloud publish failed');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'nimbus failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nimbus</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a drop with weather time.</h1>
          <p className="text-neutral-400 text-sm mb-6">rename on the way out so the public card carries a clock. discord still unfurls /s.</p>
          <input type="datetime-local" value={stamp} onChange={(e) => setStamp(e.target.value)} className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'stamping…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">embed copied: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">{link}</p>
              <button onClick={() => navigate('moss')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open moss card</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
