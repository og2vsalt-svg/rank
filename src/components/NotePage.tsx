import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function NotePage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    if (!note.trim()) return setErr('write a note to share');
    setBusy(true);
    setErr('');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(note)))}`;
    const res = await publishShare({
      id,
      name: title.trim() || 'note',
      type: 'text/plain',
      size: note.length,
      dataUrl,
      caption: note.trim(),
      author: 'note desk',
    });
    if (res.ok && res.id) {
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } else setErr(res.error || 'could not publish note');
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 16 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>note</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet note that travels alone.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Write a note. It lands in the database as a public share with polished Discord embeds. No file required. Prior desks remain. Large notes warned only by browser limits.
          </p>
          <div className="flex gap-3 mb-4">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-10 rounded-xl border border-white/10 bg-transparent"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="optional title"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm"
            />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write your note here..."
            rows={8}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none resize-none"
          />
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.975 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !note.trim()}
            style={{ backgroundColor: accent }}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'publishing…' : 'publish note'}
          </motion.button>
          {link && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-neutral-400 break-all">
              shared: {link}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
