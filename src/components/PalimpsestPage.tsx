import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PalimpsestPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const text = body.trim();
    if (!text) {
      setErr('write something first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const name = (title.trim() || 'note') + '.txt';
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const pub = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: title.trim() || undefined,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'palimpsest failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">palimpsest</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a note. it becomes a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault file — a plain text share that discord can card. scrape over it and publish again whenever you like.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none mb-3"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write on the scraped page…"
            rows={10}
            className="w-full px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none resize-y min-h-[12rem]"
          />
          <p className="text-[11px] text-neutral-500 mt-2">{body.length} characters. no cap.</p>
          <button
            onClick={publish}
            disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'publishing…' : 'publish note'}
          </button>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
