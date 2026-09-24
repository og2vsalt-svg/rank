import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function AlderPage() {
  const { addText, togglePublic } = useVault();
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('note.txt');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const publishDirect = async () => {
    if (!body.trim()) return;
    setBusy(true); setErr(''); setLink('');
    try {
      const saved = await addText(title || 'note.txt', body, 'inbox');
      if (!saved.ok) throw new Error(saved.error || 'save failed');
      const id = (saved as any).id || (saved as any).ids?.[0];
      if (id) {
        const pub = await togglePublic(id);
        if (pub.ok) {
          const urls = shareUrls(pub.id || id);
          setLink(urls.embed);
          try { await navigator.clipboard.writeText(urls.embed); } catch {}
        } else setErr(pub.error || 'saved, publish missed');
      } else {
        setErr('parked in vault. flip it public from there.');
      }
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
          <p className="text-[#0a84ff] text-sm mb-2">alder</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write, then ship a note.</h1>
          <p className="text-neutral-400 text-sm mb-6">turns typed text into a vault file and tries to publish a /s embed link.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none mb-3" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none mb-4" placeholder="type anything" />
          <button onClick={publishDirect} disabled={busy} className="px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">{busy ? 'shipping...' : 'save + publish'}</button>
          {err && <p className="text-xs text-neutral-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-[#0a84ff] mt-3 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
