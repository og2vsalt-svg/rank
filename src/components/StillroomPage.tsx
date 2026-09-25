import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function StillroomPage() {
  const { addText, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    const heading = title.trim() || 'untitled tasting';
    const body = `${heading}\n\n${note.trim() || 'no note. just the card.'}\n`;
    setBusy(true);
    setErr('');
    setWarn('');
    try {
      const result = await addText(`${heading}.txt`, body, 'notes');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not write the card');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved but cloud publish missed');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'stillroom failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">stillroom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a tasting card, not a vault pile.</h1>
          <p className="text-sm text-neutral-400 mb-6">tiny note becomes a public .txt drop. discord unfurls /s/id. no size cap, just a lag warning if you paste a novel.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} placeholder="what it smells like, where it came from, why it matters" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none mb-4" />
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'bottling…' : 'bottle and share'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-5">
              <p className="text-xs text-neutral-500 break-all">discord embed (copied): {link}</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="mt-3 text-sm text-[#0a84ff]">open share page</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
