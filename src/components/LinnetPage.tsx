import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function LinnetPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const send = async () => {
    const href = url.trim();
    if (!href) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    try {
      const name = (title.trim() || 'bookmark') + '.html';
      const html = `<!doctype html><meta charset="utf-8"><title>${title || href}</title><meta http-equiv="refresh" content="0;url=${href.replace(/"/g, '')}"><p><a href="${href.replace(/"/g, '')}">open</a></p>`;
      const dataUrl = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(html)));
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uid(),
          name,
          type: 'text/html',
          size: html.length,
          dataUrl,
          author: title || null,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'could not publish bookmark');
      const urls = shareUrls(json.id);
      setEmbed(urls.embed);
      setApp(urls.app);
      setWarn(json.warn || '');
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'linnet failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">linnet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">turn a url into a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault grid. a tiny html redirect lands in the share db so discord can unfurl /s.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="optional title" className="w-full mb-3 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full mb-4 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50" />
          <button onClick={send} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'singing…' : 'publish bookmark'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
