import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function WellPage() {
  const [name, setName] = useState('note.txt');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const bytes = new Blob([body]).size;
  const warn = bytes > 8 * 1024 * 1024 ? 'large note. the share desk may feel slow while it writes.' : '';

  async function publish() {
    setBusy(true); setErr(''); setLink('');
    try {
      const dataUrl = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(body)));
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || 'note.txt', type: 'text/plain', size: bytes, dataUrl, author: 'well' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'share failed');
      const id = j.id || j.row?.id;
      const href = `${window.location.origin}/s/${id}`;
      setLink(href);
    } catch (e: any) {
      setErr(e.message || 'could not publish');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">well</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pour a note into the public well</h1>
          <p className="text-neutral-400 text-sm mb-6">writes a text file into the same share table as a local drop. discord cards use /s/id.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="write something quiet…" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y" />
          <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
            <span>{pretty(bytes)}</span>
            <span>{warn || 'no cap. publish when ready.'}</span>
          </div>
          <button disabled={busy || !body} onClick={publish} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'writing…' : 'publish drop'}
          </button>
          {err && <p className="text-xs text-rose-300 mt-3">{err}</p>}
          {link && (
            <p className="text-sm text-[#0a84ff] mt-4 break-all">
              <a href={link}>{link}</a>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
