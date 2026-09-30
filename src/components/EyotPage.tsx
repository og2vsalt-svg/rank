import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function EyotPage() {
  const [title, setTitle] = useState('small island');
  const [body, setBody] = useState('a note that is not a vault — just a sandbar of text.');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    setErr('');
    setBusy(true);
    const text = `${title.trim()}\n\n${body}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
    setWarn(blob.size > 400000 ? 'long note. clients may feel slow opening it. no cap.' : '');
    try {
      const id = uid();
      const pub = await publishShare({
        id,
        name: `${title.trim() || 'eyot'}.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'eyot',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish eyot');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'eyot failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">eyot</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a sandbar of words.</h1>
          <p className="text-neutral-400 text-sm mb-6">write a short island, then publish it as a public drop. discord reads the embed path as a proper card.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full mb-5 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y" />
          <button onClick={publish} disabled={busy || !body.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'setting the sandbar…' : 'publish eyot'}</button>
          {warn && <p className="mt-4 text-amber-300/90 text-sm">{warn}</p>}
          {err && <p className="mt-4 text-rose-300 text-sm break-all">{err}</p>}
          {embed && <p className="mt-4 text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
