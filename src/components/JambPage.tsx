import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function JambPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const hang = async () => {
    const text = `${title.trim() || 'untitled jamb'}\n\n${body}`.trim();
    if (!text) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: `${(title || 'jamb').replace(/[^\w.-]+/g, '-').slice(0, 40)}.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'jamb',
      });
      if (!res.ok) throw new Error(res.error || 'could not hang the note');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
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
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">jamb</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">a doorframe for a note</h1>
          <p className="text-neutral-400 text-sm mb-6">write in the tab. publish as a public .txt so discord unfurls /s. not a vault drawer.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="lintel title"
            className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="what leans against the jamb"
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-[#0a84ff]/50 resize-y"
          />
          <button
            disabled={busy || !body.trim()}
            onClick={hang}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition"
          >
            {busy ? 'hanging…' : 'hang on the frame'}
          </button>
          {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 text-sm text-neutral-300 space-y-1">
              <p>discord card: <a className="text-[#0a84ff]" href={embed}>{embed}</a></p>
              <p>open: <a className="text-[#0a84ff]" href={app}>{app}</a></p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
