import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function ZephyrPage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [qr, setQr] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (f.size > 40 * 1024 * 1024) setWarn('chunky file. upload still goes, this tab might crawl. no cap.');
    setBusy(true); setErr(''); setLink('');
    try {
      const added = await addFiles([f], 'inbox');
      if (!added.ok || !added.ids?.[0]) throw new Error(added.error || 'vault miss');
      const pub = await togglePublic(added.ids[0]);
      if (!pub.ok) throw new Error(pub.error || 'cloud miss');
      const urls = shareUrls(pub.id || added.ids[0]);
      setLink(urls.embed);
      setQr(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(urls.embed)}`);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e.message || 'zephyr failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">zephyr</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hand a file through the air.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads a local file to the share db and prints a qr for the /s embed link.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-10 text-center mb-4 hover:border-[#0a84ff]/40 transition">
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            {busy ? 'sending...' : 'drop a local file'}
          </label>
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {link && (
            <div className="text-center">
              <img src={qr} alt="qr" className="mx-auto rounded-2xl mb-3 w-40 h-40 bg-white p-2" />
              <p className="text-xs text-neutral-400 break-all">{link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
