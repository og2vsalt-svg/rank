import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function paintCard(title: string, line: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const g = ctx.createLinearGradient(0, 0, 1200, 630);
  g.addColorStop(0, '#0a1a33');
  g.addColorStop(1, '#050506');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = 'rgba(10,132,255,0.18)';
  ctx.beginPath();
  ctx.arc(980, 80, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a84ff';
  ctx.font = '500 28px Inter, system-ui, sans-serif';
  ctx.fillText('rankvault', 72, 120);
  ctx.fillStyle = '#f5f5f7';
  ctx.font = '600 64px Inter, system-ui, sans-serif';
  const t = (title || 'untitled').slice(0, 42);
  ctx.fillText(t, 72, 280);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '400 28px Inter, system-ui, sans-serif';
  ctx.fillText((line || 'a quiet card').slice(0, 72), 72, 350);
  return canvas.toDataURL('image/png');
}

export default function FanlightPage() {
  const [title, setTitle] = useState('open window');
  const [line, setLine] = useState('a card for discord, minted here.');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [preview, setPreview] = useState(() => paintCard('open window', 'a card for discord, minted here.'));

  const refresh = () => setPreview(paintCard(title, line));

  const publish = async () => {
    const dataUrl = paintCard(title, line);
    setPreview(dataUrl);
    setBusy(true);
    setErr('');
    try {
      const pub = await publishShare({
        id: uid(),
        name: 'fanlight.png',
        type: 'image/png',
        size: Math.floor((dataUrl.length * 3) / 4),
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      const urls = shareUrls(pub.id || '');
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">fanlight</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paint a 1200\u00d7630 card. nothing else ships.</h1>
          <p className="text-neutral-400 text-sm mb-6">a half-moon of type for discord. not a vault dump \u2014 just the still.</p>
          <div className="space-y-3 mb-5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={refresh} className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" placeholder="title" />
            <input value={line} onChange={(e) => setLine(e.target.value)} onBlur={refresh} className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" placeholder="line" />
          </div>
          {preview && <img src={preview} alt="" className="w-full rounded-2xl mb-5" />}
          <div className="flex flex-wrap gap-2">
            <button onClick={refresh} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">redraw</button>
            <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'publishing\u2026' : 'publish card'}</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
