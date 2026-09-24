import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function QuillPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [name, setName] = useState('note.txt');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const blob = new File([text], name || 'note.txt', { type: 'text/plain' });
      const dt = new DataTransfer();
      dt.items.add(blob);
      const result = await addFiles(dt.files, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save — log in?');
        return;
      }
      const id = result.ids?.[0];
      if (!id) {
        setErr('saved locally, no id');
        return;
      }
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'cloud publish failed');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'quill failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quill</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">type it. host it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault grid. just a note that becomes a public file in the db.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="write something quiet…" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y" />
          {text.length > 200_000 && <p className="text-xs text-amber-300/80 mt-3">big paste. encoding might lag. still no hard cap.</p>}
          <div className="flex flex-wrap gap-2 mt-5">
            <button disabled={busy || !text.trim()} onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'publishing…' : 'publish note'}</button>
            <button onClick={() => navigate('paste')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">old paste desk</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">embed link copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
