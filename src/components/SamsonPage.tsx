import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from './Navbar';

export default function SamsonPage() {
  const [shareId, setShareId] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState('paint the Discord card on a file that is already filed.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);

  function fromLink(raw: string) {
    const hit = raw.trim().match(/([a-z0-9]{6,32})(?:\/?$)/i);
    setShareId(hit ? hit[1] : raw.trim());
    setCard('');
  }

  async function paint() {
    const id = shareId.trim();
    if (!id) return;
    setBusy(true);
    const r = await fetch('/api/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, cardTitle, caption, color }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setStatus(data.error || 'the card did not update');
      return;
    }
    setCard(`${window.location.origin}/s/${id}`);
    setStatus('card updated. paste the link in Discord.');
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm">card desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">samson</motion.h1>
        <p className="mt-4 text-neutral-400 text-lg max-w-xl">a filed drop keeps its bytes. this desk only changes the title, caption, and accent Discord shows.</p>
        <div className="mt-8 space-y-3">
          <input value={shareId} onChange={(e) => fromLink(e.target.value)} placeholder="share id or /s/ link" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
          <input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="card title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
          <label className="flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-xl bg-transparent border border-white/10" />
            <span className="font-mono">{color}</span>
          </label>
        </div>
        <button disabled={!shareId.trim() || busy} onClick={paint} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'painting' : 'update the card'}</button>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
        {card && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-neutral-500">Discord card</p>
            <a className="block mt-1 break-all text-[#0a84ff]" href={card}>{card}</a>
          </div>
        )}
      </main>
    </div>
  );
}
