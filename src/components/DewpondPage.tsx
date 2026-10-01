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
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function DewpondPage() {
  const [hours, setHours] = useState(24);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [drag, setDrag] = useState(false);

  const pick = (f: File | null) => {
    setFile(f);
    setLink('');
    setErr('');
    setWarn(f && f.size > 16 * 1024 * 1024 ? 'a heavy dew. the tab may lag while it condenses. no hard cap.' : '');
  };

  const condense = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const expiresAt = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000).toISOString();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
        author: 'dewpond',
      });
      if (!res.ok) throw new Error(res.error || 'the pond dried');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
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
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">dewpond</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a drop that evaporates.</h1>
          <p className="text-neutral-400 text-sm mb-6">upload a local file into the share database with a shelf life. after the hours run out the embed and the fetch both treat it as gone. no size lock.</p>
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0] || null); }}
            className={`block cursor-pointer rounded-[24px] border border-dashed p-10 text-center mb-5 transition-all duration-300 ${drag ? 'border-[#0a84ff] bg-[#0a84ff]/10 scale-[1.01]' : 'border-white/15 hover:border-[#0a84ff]/50'}`}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'lay a file on the chalk'}</span>
          </label>
          <label className="block text-xs text-neutral-500 mb-2">hours before it dries</label>
          <input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40" />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={condense} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'condensing…' : 'set the dew'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
