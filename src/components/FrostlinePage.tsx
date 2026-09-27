import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function FrostlinePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'huge file. encoding might make the tab lag a bit. no cap.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save — log in first');
        return;
      }
      const id = result.ids?.[0];
      if (!id) {
        setErr('saved locally, missing id');
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
      setErr(e?.message || 'frostline failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">frostline</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a local file onto the ice.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads into your vault then publishes a public share. discord cards use the /s/ embed url.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-12 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'freezing into the cloud…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard size limit. just a slowness warning.</p>
          </label>
          {name && <p className="text-xs text-neutral-400 mt-4">{name}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">app: {link}</p>
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <button onClick={() => navigate('share')} className="mt-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share desk</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
