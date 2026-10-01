import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function MerePage() {
  const [title, setTitle] = useState('mere note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const text = body.trim();
    if (!text) {
      setErr('write something first.');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn(text.length > 200000 ? 'long note. the tab may feel slow while it encodes. no hard cap.' : '');
    const name = `${(title || 'mere').replace(/[^\w.-]+/g, '_').slice(0, 40)}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
    const id = uid();
    const res = await publishShare({
      id,
      name,
      type: 'text/plain',
      size: blob.size,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'could not reach the share db');
      return;
    }
    if (res.warn) setWarn(res.warn);
    const urls = shareUrls(res.id || id);
    setLink(urls.app);
    setEmbed(urls.embed);
    try { await navigator.clipboard.writeText(urls.embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mere</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a still pool for a note.</h1>
          <p className="text-neutral-400 text-sm mb-6">type locally, then send the .txt into the share database. discord unfurls the /s card. this is not the vault grid.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full mb-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="what sits on the water…" className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y min-h-[180px]" />
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'sending…' : 'publish to share db'}
          </button>
          <p className="text-xs text-neutral-500 mt-3">no file limit. just a slowness ping if the note is huge.</p>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300/80 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 text-sm">
              <p className="text-neutral-500 mb-1">discord card</p>
              <p className="break-all text-[#0a84ff]">{embed}</p>
              <p className="text-neutral-600 mt-2 break-all">{link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
