import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietInkPage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [expiryDays, setExpiryDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) setWarn('this file is large. the send may feel slow. no hard limit.');
    else setWarn('');
  };

  const publish = async () => {
    const text = note.trim();
    if (!text && !file) {
      setErr('write a note or drop a file');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const toSend = file || new File([text], (title || 'note').replace(/[^a-z0-9._-]/gi, '_') + '.txt', { type: 'text/plain' });
      const expiresAt = expiryDays ? new Date(Date.now() + Number(expiryDays) * 86400000).toISOString() : null;
      const res = await publishLocalFile(toSend, {
        caption: text || title || 'quiet ink',
        cardTitle: title.trim() || (file ? file.name : 'note'),
        color: accent,
        expiresAt,
        meta: { desk: 'quietink', note: text, title: title.trim() },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 17 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quietink</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet pen for notes and light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Write a note or drop one local file. The note (or file) lands in storage and the public_shares table with your accent, title, and optional expiry. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="optional title…" className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="write your note…" rows={5} className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none" />
          <div className="flex gap-3 mb-4">
            <input type="number" min="1" placeholder="optional expiry days" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none" />
            <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-3 text-center text-sm text-neutral-300 transition">
              <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
              {file ? file.name : 'optional local file'}
            </label>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={busy || (!note.trim() && !file)} className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition" style={{ background: accent }}>
            {busy ? 'inking…' : 'publish quiet ink'}
          </motion.button>
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all">
              share link (copied): {link}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
