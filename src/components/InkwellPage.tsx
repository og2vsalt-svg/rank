import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function InkwellPage() {
  const [title, setTitle] = useState('untitled note');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const text = body.trim();
    if (!text) {
      setErr('write something first');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const size = blob.size;
    setWarn(size > 2 * 1024 * 1024 ? 'chunky note. no hard cap, just might encode slowly.' : '');
    setErr('');
    setBusy(true);
    try {
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = crypto.randomUUID().slice(0, 10);
      const res = await publishShare({
        id,
        name: `${title.trim() || 'note'}.txt`,
        type: 'text/plain',
        size,
        dataUrl,
        author: author.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] text-[#0a84ff] mb-3 tracking-wide">inkwell</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">paste a note. ship a link.</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">not a vault dump. just text, stored in the public shares table so discord unfurls look clean.</p>
          <div className="rounded-3xl bg-white/[0.04] border border-white/8 p-5 space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="title" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none resize-y font-mono leading-relaxed" placeholder="write anything. no file cap — we only warn if it might lag." />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="optional byline" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-neutral-500">{pretty(new Blob([body]).size)} · no hard limit</p>
              <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
                {busy ? 'inking…' : 'publish note'}
              </button>
            </div>
            {warn && <p className="text-xs text-amber-300">{warn}</p>}
            {err && <p className="text-xs text-rose-300">{err}</p>}
          </div>
          {link && (
            <div className="mt-6 rounded-3xl bg-white/[0.03] border border-white/8 p-5 space-y-2">
              <p className="text-sm text-white break-all">{link}</p>
              <p className="text-xs text-neutral-500 break-all">discord embed: {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
