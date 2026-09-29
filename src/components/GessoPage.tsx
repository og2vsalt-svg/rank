import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function GessoPage() {
  const [title, setTitle] = useState('rankvault');
  const [body, setBody] = useState('a quiet drop');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const paint = async () => {
    setBusy(true);
    setErr('');
    try {
      const c = document.createElement('canvas');
      c.width = 1200;
      c.height = 630;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      const g = ctx.createLinearGradient(0, 0, 1200, 630);
      g.addColorStop(0, '#050506');
      g.addColorStop(1, '#0a1a33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = '#0a84ff';
      ctx.fillRect(0, 0, 8, 630);
      ctx.fillStyle = '#f5f5f7';
      ctx.font = '600 64px Inter, system-ui, sans-serif';
      ctx.fillText(title.slice(0, 28), 72, 280);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '400 32px Inter, system-ui, sans-serif';
      ctx.fillText(body.slice(0, 48), 72, 350);
      ctx.fillStyle = '#52525b';
      ctx.font = '500 20px Inter, system-ui, sans-serif';
      ctx.fillText('rankvault', 72, 560);
      const dataUrl = c.toDataURL('image/jpeg', 0.92);
      const id = uid();
      const pub = await publishShare({
        id,
        name: 'gesso-card.jpg',
        type: 'image/jpeg',
        size: Math.round(((dataUrl.split(',')[1] || '').length * 3) / 4),
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'gesso failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">gesso</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">prime a 1200×630 card for discord.</h1>
          <p className="text-neutral-400 text-sm mb-6">paints a still in the tab, then files it in the share db so /s unfurls cleanly.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
          />
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full mb-5 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
          />
          <button onClick={paint} disabled={busy} className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'painting…' : 'paint and publish'}
          </button>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
