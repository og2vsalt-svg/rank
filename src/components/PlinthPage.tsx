import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function PlinthPage() {
  const { files } = useVault();
  const [picked, setPicked] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const local = useMemo(() => files.slice(0, 40), [files]);

  const publish = async () => {
    const f = local.find((x: any) => x.id === picked);
    if (!f) {
      setErr('pick a file from your vault first');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn('');
    try {
      const dataUrl = f.dataUrl || f.url;
      if (!dataUrl) {
        setErr('that file has no payload in this tab');
        return;
      }
      if ((f.size || 0) > 40 * 1024 * 1024) setWarn('chunky file. encoding might feel slow. no hard cap.');
      const res = await publishShare({
        id: f.id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size || 0,
        dataUrl,
        author: 'plinth',
      });
      if (!res.ok) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || f.id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not lift it onto the plinth');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">plinth</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">put one file on a stand.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick something already in your vault and publish it to the cloud db. you get a /s/ card url made for discord embeds.</p>
          <select value={picked} onChange={(e) => setPicked(e.target.value)} className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4">
            <option value="">choose a vault file</option>
            {local.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'lifting…' : 'raise it'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">embed url copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
