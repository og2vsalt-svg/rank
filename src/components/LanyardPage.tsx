import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function LanyardPage() {
  const { addFiles, togglePublic } = useVault();
  const [tag, setTag] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const hang = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setLink('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. encoding may hitch. no hard cap.' : '');
    try {
      const buf = await file.arrayBuffer();
      const u = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
      const payload = JSON.stringify({
        kind: 'lanyard',
        tag: tag.trim() || 'untagged',
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: btoa(s),
      });
      const slug = (tag.trim() || 'drop').replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
      const wrapped = new File([payload], `lanyard-${slug}.json`, { type: 'application/json' });
      const result = await addFiles([wrapped], 'drops');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save lanyard');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, publish missed');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.card);
      try { await navigator.clipboard.writeText(urls.card); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lanyard failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lanyard</p>
          <h1 className="text-3xl font-semibold mb-3">hang a tag on a file, then mint a card.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault grid. the tag rides inside the drop so a discord /s card has a name to wear.</p>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="tag — festival, set, dump" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 mb-4" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'pick a file'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)}</p>}
          </label>
          <button disabled={!file || busy} onClick={hang} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'hanging…' : 'hang lanyard'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
