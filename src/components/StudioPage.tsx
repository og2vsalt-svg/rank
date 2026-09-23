import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function StudioPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('note.txt');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [id, setId] = useState<string | null>(null);

  const publish = async () => {
    const name = (title.trim() || 'note.txt').replace(/[^\w.\- ]/g, '_');
    const text = body || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], name.endsWith('.txt') || name.includes('.') ? name : name + '.txt', { type: 'text/plain' });
    if (file.size > 40 * 1024 * 1024) setWarn('this note is huge. the tab might lag. no hard cap.');
    else setWarn('');
    setErr('');
    setBusy(true);
    try {
      const list = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
        [Symbol.iterator]: function* () { yield file; },
      } as unknown as FileList;
      const result = await addFiles(list, 'studio');
      if (!result.ok) {
        setErr(result.error || 'could not save — log in first');
        return;
      }
      const nextId = result.ids?.[0];
      if (!nextId) {
        setErr('saved, no id');
        return;
      }
      const pub = await togglePublic(nextId);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud publish failed');
        setId(nextId);
        return;
      }
      setId(nextId);
      const urls = shareUrls(nextId);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">studio</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">write it here, ship a link.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault grid. just a quiet page for notes that become public drops.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="filename" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 transition" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="type or paste" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 transition resize-y min-h-[220px]" />
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform">{busy ? 'publishing…' : 'publish note'}</button>
            {id && <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">open share</button>}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed: {shareUrls(id || '').embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
