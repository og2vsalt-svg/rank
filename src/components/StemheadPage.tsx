import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function StemheadPage() {
  const [title, setTitle] = useState('stem note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const words = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);

  async function publish() {
    setBusy(true);
    setErr('');
    try {
      const text = `# ${title || 'stem note'}\n\n${body}\n`;
      const file = new File([text], `${(title || 'stem').slice(0, 40).replace(/\s+/g, '-').toLowerCase()}.md`, { type: 'text/markdown' });
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('caption', body.slice(0, 180));
      form.append('author', 'stemhead');
      const res = await fetch('/api/quay', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'the stem did not take the note');
      setLink(data.card || `/s/${data.id}`);
    } catch (e: any) {
      setErr(e.message || 'quiet failure');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#0a84ff] text-sm font-medium mb-3">stemhead</motion.p>
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">a note at the bow</h1>
        <p className="text-neutral-400 text-sm mb-6">writing stays in the tab until you publish. the card is a markdown drop, not a cabinet.</p>
        <div className="glass rounded-3xl p-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent text-2xl font-medium text-white outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="the line you want on the card" className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none resize-y" />
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{words} words</span>
            <button type="button" disabled={!body.trim() || busy} onClick={publish} className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-40">{busy ? 'publishing…' : 'publish the note'}</button>
          </div>
          {err && <p className="text-xs text-red-300">{err}</p>}
          {link && <a className="text-sm text-[#0a84ff] break-all" href={link}>{link}</a>}
        </div>
      </main>
    </div>
  );
}
