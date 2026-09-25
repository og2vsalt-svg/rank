import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function HatchPage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [app, setApp] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    setName(f.name);
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. no cap, but this tab might hitch while it encodes.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles([f], 'hatch');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save — try logging in first');
        return;
      }
      const id = result.ids[0];
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud publish missed');
        return;
      }
      const urls = shareUrls(id);
      setApp(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hatch failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">hatch</p>
          <h1 className="text-3xl font-semibold mb-3">drop a file, get a discord-ready link.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads into your vault, publishes to the cloud db, copies the embed url. paste it in discord and it looks like a real share card.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-12 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop or click'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">last file · {name}</p>
              <div className="rounded-2xl bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">discord embed</p>
                <p className="text-sm break-all text-[#0a84ff]">{embed}</p>
              </div>
              <div className="rounded-2xl bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">app link</p>
                <p className="text-sm break-all text-neutral-300">{app}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
