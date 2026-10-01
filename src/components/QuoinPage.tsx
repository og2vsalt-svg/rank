import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function drawCard(title: string, body: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(180, 0);
  ctx.lineTo(0, 180);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5f5f7';
  ctx.font = '600 54px -apple-system, Inter, sans-serif';
  ctx.fillText(title.slice(0, 28) || 'quoin', 80, 280);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '400 28px -apple-system, Inter, sans-serif';
  const lines = (body || 'a corner card for discord').slice(0, 160);
  ctx.fillText(lines.slice(0, 52), 80, 340);
  ctx.fillText(lines.slice(52, 104), 80, 384);
  ctx.fillStyle = '#0a84ff';
  ctx.font = '500 20px -apple-system, Inter, sans-serif';
  ctx.fillText('rankvault · quoin', 80, 560);
  return canvas.toDataURL('image/png');
}

export default function QuoinPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const preview = drawCard(title, body, accent);

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const dataUrl = drawCard(title.trim() || 'quoin', body, accent);
      const id = uid();
      const blob = await (await fetch(dataUrl)).blob();
      const res = await publishShare({
        id,
        name: `${title.trim() || 'quoin'}.png`,
        type: 'image/png',
        size: blob.size,
        dataUrl,
        author: 'quoin',
      });
      if (!res.ok) throw new Error(res.error || 'quoin slipped');
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
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">quoin</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">raise a corner card.</h1>
          <p className="text-neutral-400 text-sm mb-6">a 1200×630 still painted in the tab, then filed so discord can unfurl it. not a vault drawer.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title on the stone" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="one quiet line" rows={3} className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-9 rounded-full overflow-hidden bg-transparent" />
            <span className="text-xs text-neutral-500">corner accent</span>
          </div>
          {preview && <img src={preview} alt="" className="w-full rounded-2xl mb-5 border border-white/10" />}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'setting the stone…' : 'publish card'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
