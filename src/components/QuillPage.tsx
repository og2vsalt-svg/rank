import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function QuillPage() {
  const { addFiles, togglePublic } = useVault();
  const [title, setTitle] = useState('untitled note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    setErr('');
    setLink('');
    const text = `# ${title.trim() || 'untitled'}\n\n${body}`;
    if (text.length > 400_000) setWarn('long note. encoding may feel slow. no size cap.');
    else setWarn('');
    const file = new File([text], `${(title || 'note').replace(/[^\w.-]+/g, '_').slice(0, 48)}.md`, { type: 'text/markdown' });
    setBusy(true);
    try {
      const result = await addFiles([file] as unknown as FileList, 'notes');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save note');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved, but publish failed');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quill</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a note. ship it as a drop.</h1>
          <p className="text-sm text-neutral-500 mb-6">stays in your vault first. publish turns it into a public markdown file with a discord-ready link.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" placeholder="title" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y focus:border-[#0a84ff]/50 leading-relaxed" placeholder="write anything" />
          <button disabled={busy} onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'publishing…' : 'publish note'}</button>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && <p className="text-sm text-neutral-300 mt-4 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
