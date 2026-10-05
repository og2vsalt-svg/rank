import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SLOW = 3.5 * 1024 * 1024;

export default function HawsepipePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  function pick(f: File | null) {
    setFile(f);
    setLink('');
    setErr('');
    setWarn(f && f.size > SLOW ? 'this one is heavy. the pipe still takes it, but the tab may pause. no size lock.' : '');
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', caption);
      body.append('author', author || 'hawsepipe');
      const res = await fetch('/api/quay', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'the pipe did not take the file');
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
      <main className="pt-24 pb-20 px-5 max-w-xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">hawsepipe</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl font-semibold tracking-tight text-white mb-3">
          a pipe for a local file
        </motion.h1>
        <p className="text-neutral-400 text-sm leading-relaxed mb-8">
          the file lands in the quay table, then a public card is written so Discord can unfurl <span className="text-white">/s</span>. not another vault drawer.
        </p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 space-y-4">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            {file ? file.name : 'choose a file from this machine'}
          </label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the card" className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption discord will show" rows={3} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none" />
          {warn && <p className="text-xs text-amber-300/90">{warn}</p>}
          {err && <p className="text-xs text-red-300">{err}</p>}
          <button type="button" disabled={!file || busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-3 disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'running the pipe…' : 'hand it to the table'}
          </button>
          <p className="text-xs text-neutral-500">no hard limit. we only warn when the request might feel slow.</p>
          {link && (
            <a href={link} className="block text-sm text-[#0a84ff] break-all">{link}</a>
          )}
        </motion.div>
      </main>
    </div>
  );
}
