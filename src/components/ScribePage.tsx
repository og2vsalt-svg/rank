import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function ScribePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('untitled note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [id, setId] = useState('');

  const publish = async () => {
    setErr('');
    setLink('');
    const text = (title.trim() ? '# ' + title.trim() + '\n\n' : '') + body;
    if (!text.trim()) { setErr('write something first'); return; }
    if (text.length > 400000) setWarn('long note. encoding may feel slow. no hard cap.');
    else setWarn('');
    setBusy(true);
    try {
      const file = new File([text], (title.trim() || 'note') + '.md', { type: 'text/markdown' });
      const result = await addFiles([file], 'notes');
      if (!result.ok || !result.ids?.[0]) { setErr(result.error || 'could not save'); return; }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) { setErr(pub.error || 'saved locally, publish missed'); return; }
      const urls = shareUrls(result.ids[0]);
      setId(result.ids[0]);
      setLink(urls.card);
      try { await navigator.clipboard.writeText(urls.card); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">scribe</p>
          <h1 className="text-3xl font-semibold mb-3">write a note, ship a link.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays in your vault as markdown and goes public on the same db as file drops. discord cards use the /s/ path.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" placeholder="title" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 resize-y" placeholder="start writing…" />
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'publishing…' : 'publish note'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">copied card link: {link}</p>}
          {id && <button onClick={() => navigate('share', id)} className="mt-3 text-[13px] text-[#0a84ff]">open share page</button>}
        </motion.div>
      </div>
    </div>
  );
}
