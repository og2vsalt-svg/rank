import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function TrussPage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const stats = useMemo(() => {
    const t = text;
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    return { chars: t.length, words, lines: t ? t.split('\n').length : 0 };
  }, [text]);

  const publish = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = uid();
      const pub = await publishShare({
        id,
        name: 'truss-note.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
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
      setErr(e?.message || 'truss failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">truss</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">brace a note, then ship it if you want.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a writing desk, not a vault. counts stay local. publish only when you ask.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
            placeholder="write something quiet…"
          />
          <div className="flex items-center justify-between mt-3 text-[12px] text-neutral-500">
            <span>{stats.words} words · {stats.chars} chars · {stats.lines} lines</span>
            <button
              onClick={publish}
              disabled={busy || !text.trim()}
              className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'publishing…' : 'publish .txt'}
            </button>
          </div>
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
