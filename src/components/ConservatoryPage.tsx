import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function ConservatoryPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');
  const [meta, setMeta] = useState('');

  const send = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('conservatory only takes stills. try parcel for other kinds.');
      return;
    }
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'a very large pane. no cap — glass may fog while encoding.' : '');
    setMeta(file.name + ' · ' + pretty(file.size));
    setBusy(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      setPreview(dataUrl);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size, dataUrl, author: 'conservatory' }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e) {
      setErr(e?.message || 'conservatory failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">conservatory</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stills under glass.</h1>
          <p className="text-neutral-400 text-sm mb-6">images only. the pane becomes a discord card with the still as the embed art.</p>
          {preview && <img src={preview} alt="" className="mb-6 w-full max-h-80 object-cover rounded-[24px]" />}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files?.[0]); }}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'warming the glass…' : 'drop a still'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
