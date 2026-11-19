import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare } from '../lib/cloudShare';

export default function QuietLinkPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const share = async () => {
    if (!url.trim()) return setErr('paste a link');
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const name = title.trim() || new URL(url).hostname || 'link';
      const caption = note.trim() || url.trim();
      // Create a tiny text file containing the URL so it lands in the same database
      const blob = new Blob([url.trim()], { type: 'text/plain' });
      const file = new File([blob], name + '.txt', { type: 'text/plain' });
      const res = await import('../lib/cloudShare').then(m => m.publishLocalFile(file, {
        caption,
        color: accent,
        cardTitle: name,
        meta: { desk: 'link', originalUrl: url.trim() },
      }));
      if (res.ok && res.embed) {
        setLink(res.embed);
        setUrl('');
        setTitle('');
        setNote('');
      } else {
        setErr(res.error || 'the link paused');
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase text-[#0A84FF] mb-2">Quiet Link</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-white mb-3">Share a quiet link.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed">
            Paste any URL. Give it a title and a short note. It becomes a shareable card that settles into the database with a polished Discord embed. Soft warnings only. No hard limits. Apple-style springs on frosted glass. All prior desks remain fully intact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[28px] p-7 shadow-2xl"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional quiet note…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Link accent</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !url.trim()}
            className="w-full rounded-[20px] py-3.5 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Share the link'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center">
                <a href={link} target="_blank" rel="noreferrer" className="text-[14px] break-all" style={{ color: accent }}>{link}</a>
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
