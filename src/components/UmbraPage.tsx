import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function extOf(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i) : '';
}

export default function UmbraPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');
  const [shown, setShown] = useState('');

  const send = async (file) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'shadow is large. no cap, encoding may lag.' : '');
    const cover = 'drop' + (extOf(file.name) || '');
    setShown(cover + ' · ' + pretty(file.size));
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cover, type: file.type || 'application/octet-stream', size: file.size, dataUrl, author: 'umbra' }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e) {
      setErr(e?.message || 'umbra failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">umbra</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">share from the shade.</h1>
          <p className="text-neutral-400 text-sm mb-6">the original filename stays on your machine. the public card only sees a quiet drop name.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files?.[0]); }}>
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'dimming…' : 'drop a file into shadow'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {shown && <p className="text-xs text-neutral-500 mt-4">{shown}</p>}
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
