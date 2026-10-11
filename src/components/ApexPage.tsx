import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function ApexPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [fileName, setFileName] = useState('');

  const onFile = async (file: File | null) => {
    if (!file) return;
    const big = file.size > 40 * 1024 * 1024;
    setWarn(big ? 'large file. the upload may feel slow. no hard limit — just a gentle warning.' : '');
    setErr('');
    setLink('');
    setFileName(file.name);
    setBusy(true);
    try {
      const result = await publishLocalFile(file, {
        caption: note.trim() || 'apex drop',
        cardTitle: note.trim() ? note.trim().slice(0, 80) : file.name,
        author: 'apex',
      });
      if (!result.ok || !result.id) {
        setErr(result.error || 'could not publish');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const urls = shareUrls(result.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 sm:p-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">apex</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">the high point of a drop.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            Drop one local file. Add an optional peak note. It lands in storage and the public share table. Discord will unfurl the link cleanly. Large files get a slowness note only — never refused.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional peak note (shows on the card)"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/40 mb-4"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-12 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0] || null); }}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'click or drop a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">one file · no size gate</p>
          </label>
          {fileName && !busy && <p className="text-xs text-neutral-500 mt-3">ready: {fileName}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && !err && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">share link (copied): {link}</p>
              <a
                href={link}
                className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
              >
                open share
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
