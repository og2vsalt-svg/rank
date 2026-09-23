import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function CaskPage() {
  const { addFiles, togglePublic, files } = useVault();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const pack = async (list: FileList | null) => {
    if (!list?.length) return;
    const arr = [...list];
    if (arr.some((f) => f.size > 40 * 1024 * 1024)) setWarn('chunky files. no cap, but encoding this cask may hitch.');
    else setWarn('');
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const manifest = { kind: 'rank.cask', at: new Date().toISOString(), files: arr.map((f) => ({ name: f.name, type: f.type, size: f.size })) };
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const file = new File([blob], `cask-${Date.now()}.json`, { type: 'application/json' });
      const result = await addFiles([file], 'cask');
      if (!result.ok) { setErr(result.error || 'could not save cask'); return; }
      const id = result.ids?.[0];
      if (id) {
        const pub = await togglePublic(id);
        if (pub.ok) setLink(shareUrls(id).embed);
        else setErr(pub.error || 'saved locally, cloud publish missed');
      }
    } catch (e: any) {
      setErr(e?.message || 'cask failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">cask</p>
          <h1 className="text-3xl font-semibold mb-3">pack a manifest, not the bytes.</h1>
          <p className="text-neutral-400 text-sm mb-6">writes a json barrel of names and sizes to the cloud db. useful when you want a packing list without dumping every file again.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition mb-4">
            <input type="file" multiple className="hidden" onChange={(e) => pack(e.target.files)} />
            <span className="text-sm text-neutral-300">{busy ? 'sealing…' : 'pick local files'}</span>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mb-3">{warn}</p>}
          {err && <p className="text-rose-300 text-sm mb-3">{err}</p>}
          {link && <p className="text-sm break-all text-[#0a84ff]">{link}</p>}
          <p className="text-xs text-neutral-500 mt-6">{files.length} items already sitting in the vault on this device.</p>
        </motion.div>
      </div>
    </div>
  );
}
