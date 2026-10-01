import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function slug(s: string) {
  return s.toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NeckingPage() {
  const [raw, setRaw] = useState('the quiet side of the house');
  const [mode, setMode] = useState<'title' | 'slug' | 'lower' | 'upper'>('title');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const out = useMemo(() => {
    if (mode === 'slug') return slug(raw);
    if (mode === 'lower') return raw.toLowerCase();
    if (mode === 'upper') return raw.toUpperCase();
    return titleCase(raw);
  }, [raw, mode]);

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const id = uid();
      const res = await publishShare({
        id,
        name: 'necking.txt',
        type: 'text/plain',
        size: out.length,
        dataUrl: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(out)))}`,
        author: 'necking',
        caption: out.slice(0, 140),
      });
      if (!res.ok) throw new Error(res.error || 'could not set the pane');
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-7">
          <p className="text-[#0a84ff] text-sm font-medium mb-2">necking</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a window for wording</h1>
          <p className="text-neutral-400 text-sm mb-5">reshape a line in the tab. ship it only if you want a discord card.</p>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={4} className="w-full rounded-3xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none mb-4" />
          <div className="flex flex-wrap gap-2 mb-4">
            {(['title', 'slug', 'lower', 'upper'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`px-3.5 py-1.5 rounded-full text-sm transition-colors duration-200 ${mode === m ? 'bg-white text-black' : 'bg-white/8 text-neutral-300'}`}>{m}</button>
            ))}
          </div>
          <motion.p key={out} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="text-white text-lg tracking-tight mb-5 break-words">{out || '—'}</motion.p>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !out} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'setting…' : 'publish the pane'}</button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
