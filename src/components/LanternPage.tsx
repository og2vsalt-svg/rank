import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function LanternPage() {
  const { addText, togglePublic } = useVault();
  const [title, setTitle] = useState('untitled drop');
  const [blurb, setBlurb] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const ship = async () => {
    setBusy(true); setErr(''); setLink('');
    const body = JSON.stringify({ title, blurb, color, kind: 'lantern-card', at: new Date().toISOString() }, null, 2);
    try {
      const saved = await addText(`${title || 'card'}.json`, body, 'inbox');
      if (!saved.ok) throw new Error(saved.error || 'save failed');
      const id = (saved as any).id || (saved as any).ids?.[0];
      if (!id) {
        setErr('parked in vault. flip public from there.');
        return;
      }
      const pub = await togglePublic(id);
      if (pub.ok) {
        const urls = shareUrls(pub.id || id);
        setLink(urls.embed);
        try { await navigator.clipboard.writeText(urls.embed); } catch {}
      } else setErr(pub.error || 'saved, publish missed');
    } catch (e: any) {
      setErr(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lantern</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">make a card, ship an embed.</h1>
          <p className="text-neutral-400 text-sm mb-6">tiny json drop with a title + blurb. discord picks up the /s link.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none mb-3" placeholder="title" />
          <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={5} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none mb-3" placeholder="what this is" />
          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-xl bg-transparent border border-white/10" />
            <span className="text-xs text-neutral-500">accent for your own notes</span>
          </div>
          <div className="rounded-3xl p-6 mb-5 border border-white/10" style={{ background: `linear-gradient(160deg, ${color}22, transparent)` }}>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">preview</p>
            <h2 className="text-xl font-semibold">{title || 'untitled drop'}</h2>
            <p className="text-sm text-neutral-400 mt-1 whitespace-pre-wrap">{blurb || 'empty card'}</p>
          </div>
          <button onClick={ship} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'shipping…' : 'save + publish'}</button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-[#0a84ff] mt-3 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
