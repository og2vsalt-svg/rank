import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function RipplePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [fileName, setFileName] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    setFileName(file.name);
    const big = file.size > 40 * 1024 * 1024;
    setWarn(big ? 'large file — tab may lag while encoding/sending. no hard limit.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || 'ripple',
        cardTitle: note.trim().slice(0, 80) || file.name,
        meta: { desk: 'ripple' },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'ripple failed');
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
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">ripple</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a file, leave a short note.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            Local file goes straight into storage and the public_shares table. Discord unfurls the link with a clean card. Large files only get a gentle slow warning — never refused.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="short ripple note (optional)"
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
            rows={3}
          />

          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-10 text-center transition-all duration-200"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sending ripple…' : fileName || 'click or drop a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size gate. just a warning if it might feel slow.</p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">share link (copied): {link}</p>
              <p className="text-xs text-neutral-500">Paste in Discord for the professional embed.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
