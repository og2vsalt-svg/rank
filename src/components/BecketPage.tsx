import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not loop the file'));
    r.readAsDataURL(file);
  });
}

export default function BecketPage() {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f && f.size > 20 * 1024 * 1024 ? 'heavy loop. the tab may hitch while it writes. no hard cap.' : '');
  };

  const loop = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const named = label.trim() ? `${label.trim()} — ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name: named,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'becket',
      });
      if (!res.ok) throw new Error(res.error || 'the loop slipped');
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
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">becket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">loop a file, name the hitch.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. drop a local file, give it a spoken label, write it into the public share table. discord gets a /s card.
          </p>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files?.[0] || null);
            }}
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center mb-5 transition-all duration-300"
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'drop a file through the loop'}</span>
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="optional spoken label"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors"
          />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button
            onClick={loop}
            disabled={busy || !file}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]"
          >
            {busy ? 'hitching…' : 'hitch to the db'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
