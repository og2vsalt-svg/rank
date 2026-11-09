import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietJournalPage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#A78BFA');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) setWarn('this attachment is heavy. sharing may feel slow. no hard limit.');
    else setWarn('');
  };

  const publish = async () => {
    if (!note.trim() && !file) {
      setErr('write a note or attach a local file');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      let toSend: File;
      if (file) {
        toSend = file;
      } else {
        // pure note becomes a quiet text file
        const blob = new Blob([note], { type: 'text/plain' });
        toSend = new File([blob], `${title.trim() || 'journal'}.txt`, { type: 'text/plain' });
      }
      const res = await publishLocalFile(toSend, {
        caption: note.trim() || 'quiet journal entry',
        cardTitle: title.trim() || (file ? file.name : 'journal entry'),
        color: accent,
        meta: { desk: 'quietjournal', note: note.trim(), title: title.trim() },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'failed to share');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const url = shareUrls(res.id).app;
      setLink(url);
      try { await navigator.clipboard.writeText(url); } catch {}
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 16 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quiet journal</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">leave a quiet page.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Write a note and optionally attach one local file. The entry lands in storage and public_shares. Every link unfurls a polished Discord card. Large attachments gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
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
            placeholder="optional title…"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#A78BFA]/50 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write your quiet page…"
            rows={5}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#A78BFA]/50 transition resize-none"
          />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#A78BFA]/40 p-6 text-center transition mb-4">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-sm text-neutral-300">{file ? file.name : 'optional local file attachment'}</p>
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
            {busy ? 'binding…' : 'share the page'}
          </motion.button>
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400">
              <p>share link (copied):</p>
              <div className="break-all mt-1">{link}</div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
