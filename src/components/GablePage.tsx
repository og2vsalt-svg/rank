import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function GablePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState('rankvault');
  const [sub, setSub] = useState('quiet public drop');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const paint = (name?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const g = ctx.createLinearGradient(0, 0, 1200, 630);
    g.addColorStop(0, '#050506');
    g.addColorStop(0.55, '#0b1220');
    g.addColorStop(1, '#0a84ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(120, 520);
    ctx.lineTo(600, 90);
    ctx.lineTo(1080, 520);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5f5f7';
    ctx.font = '600 64px Inter, system-ui, sans-serif';
    ctx.fillText((title || 'rankvault').slice(0, 28), 88, 250);
    ctx.fillStyle = 'rgba(245,245,247,0.72)';
    ctx.font = '400 28px Inter, system-ui, sans-serif';
    ctx.fillText((sub || name || 'quiet public drop').slice(0, 52), 88, 310);
    ctx.fillStyle = '#0a84ff';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText('rankvault · discord card', 88, 540);
    const url = canvas.toDataURL('image/png');
    setPreview(url);
    return url;
  };

  const ship = async () => {
    setErr('');
    setBusy(true);
    try {
      const dataUrl = paint() || preview;
      if (!dataUrl) throw new Error('could not paint card');
      const id = uid();
      const res = await publishShare({
        id,
        name: `${title || 'gable'}.png`,
        type: 'image/png',
        size: Math.floor(((dataUrl.split(',')[1] || '').length * 3) / 4),
        dataUrl,
        author: sub || undefined,
      });
      if (!res.ok) throw new Error(res.error || 'gable failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'gable failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gable</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paint a roof card, then hang it on discord.</h1>
          <p className="text-neutral-400 text-sm mb-6">1200×630 still. only the card goes to the share db so unfurls look finished.</p>
          <div className="grid gap-3 mb-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => paint()} className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" placeholder="title" />
            <input value={sub} onChange={(e) => setSub(e.target.value)} onBlur={() => paint()} className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" placeholder="subtitle" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {preview && <img src={preview} alt="" className="w-full rounded-2xl mb-4 border border-white/10" />}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => paint()} className="px-5 py-2.5 rounded-full bg-white/8 text-sm">preview</button>
            <button onClick={ship} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'hanging…' : 'publish card'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
