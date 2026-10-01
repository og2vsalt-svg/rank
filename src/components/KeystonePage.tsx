import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read that file'));
    r.readAsDataURL(file);
  });
}

export default function KeystonePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [lock, setLock] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = (f: File | null) => {
    setFile(f);
    setLink('');
    setErr('');
    setWarn(f && f.size > 12 * 1024 * 1024 ? 'heavy stone. the tab may pause while it encodes. no size lock.' : '');
  };

  const setStone = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: lock.trim() || undefined,
        author: 'keystone',
        caption: caption.trim() || file.name,
      });
      if (!res.ok) throw new Error(res.error || 'the arch did not take');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-7">
          <p className="text-[#0a84ff] text-sm font-medium mb-2">keystone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">set one local in the arch</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads the file into the public shares table. discord reads the /s card, caption included. a spoken phrase only gates the preview in the tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center mb-4 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-200">{file ? `${file.name} · ${pretty(file.size)}` : 'choose a file from this device'}</span>
          </label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the discord card" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-3" />
          <input value={lock} onChange={(e) => setLock(e.target.value)} placeholder="optional spoken phrase" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-4" />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={setStone} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'setting the stone…' : 'upload and share'}</button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
