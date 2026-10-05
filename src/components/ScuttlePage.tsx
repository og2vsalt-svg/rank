import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function ScuttlePage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f && f.size > 16 * 1024 * 1024 ? 'wide hatch. the send may feel sleepy. no hard cap.' : '');
  };

  const openHatch = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const res = await publishLocalFile(file, { author: 'scuttle', caption: file.name });
      if (!res.ok || !res.id) throw new Error(res.error || 'hatch jammed');
      const urls = shareUrls(res.id);
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">scuttle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">open a hatch, drop one file through.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads a local file straight into the public shares table. discord reads /s. no size limit — only a slowness warning when the hatch is wide.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center mb-5 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'choose a local file'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={openHatch} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'opening the hatch…' : 'send through'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
