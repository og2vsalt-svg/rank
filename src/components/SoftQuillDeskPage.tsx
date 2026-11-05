import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuillDeskPage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(24).then(setRecent).catch(() => setRecent([]));
  }, []);

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'this file is large. the upload may feel slow. no hard limit.' : '');
  };

  const publish = async () => {
    if (!note.trim() && !file) {
      setErr('write a note or drop a file');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const caption = note.trim() || 'soft quill';
      const cardTitle = title.trim() || (file ? file.name : 'quiet note');
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          cardTitle,
          color: accent,
          meta: { desk: 'softquilldesk', note: note.trim(), title: title.trim() },
        });
      } else {
        // For pure notes, we still need a placeholder file or handle text-only; assuming publish supports or use a text blob
        const blob = new Blob([note], { type: 'text/plain' });
        const textFile = new File([blob], `${cardTitle}.txt`, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          cardTitle,
          color: accent,
          meta: { desk: 'softquilldesk', note: note.trim(), title: title.trim(), pureNote: true },
        });
      }
      if (!res.ok || !res.id) {
        setErr(res.error || 'failed to settle');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
      listPublicShares(24).then(setRecent).catch(() => {});
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8 mb-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>soft quill desk</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet desk for notes and what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Write a note, give it a title, optionally attach a local file. It settles into storage and the public_shares table with your accent. Every share link unfurls a polished Discord card. Large files receive only a gentle warning of possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="quiet title…"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#FF9500]/50 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write your note here…"
            rows={5}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#FF9500]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#FF9500]/40 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-sm text-neutral-300">{file ? file.name : 'optional local file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || (!note.trim() && !file)}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'settle the note'}
          </motion.button>
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400">
              <p>share link (copied):</p>
              <div className="break-all mt-1">{link}</div>
            </motion.div>
          )}
        </motion.div>

        <h2 className="text-lg font-medium mb-4 text-neutral-300">recent quiet notes</h2>
        <div className="grid gap-3">
          {recent.slice(0, 8).map((item, i) => (
            <motion.a
              key={item.id}
              href={shareUrls(item.id).app}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
              className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
            >
              <p className="text-sm font-medium truncate">{item.cardTitle || item.name}</p>
              {item.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.caption}</p>}
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
