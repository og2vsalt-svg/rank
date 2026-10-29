import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftLumenScrollPage() {
  const [entries, setEntries] = useState<{ id: string; note: string; fileName?: string; link?: string }[]>([]);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) setWarn('this file is large. the send may feel slow. no hard limit.');
    else setWarn('');
  };

  const addEntry = async () => {
    const text = note.trim();
    if (!text && !file) {
      setErr('write a note or drop a file');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const toSend = file || new File([text], (title || 'scroll').replace(/[^a-z0-9._-]/gi, '_') + '.txt', { type: 'text/plain' });
      const res = await publishLocalFile(toSend, {
        caption: text || title || 'soft lumen scroll',
        cardTitle: title.trim() || (file ? file.name : 'scroll entry'),
        color: accent,
        meta: { desk: 'softlumenscroll', note: text, title: title.trim() },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setEntries((prev) => [...prev, { id: res.id, note: text || file?.name || 'entry', fileName: file?.name, link: urls.app }]);
      setNote('');
      setFile(null);
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
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>softlumenscroll</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet vertical scroll of shared light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Add notes or drop local files into a still vertical scroll. Each entry lands in storage and the public_shares table with your accent and title. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="optional shared title…" className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="add a note to the scroll…" rows={3} className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none" />
          <label className="block mb-4 cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-3 text-center text-sm text-neutral-300 transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            {file ? file.name : 'optional local file'}
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={addEntry} disabled={busy || (!note.trim() && !file)} className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition" style={{ background: accent }}>
            {busy ? 'scrolling…' : 'add to scroll'}
          </motion.button>
        </motion.div>

        <div className="mt-8 space-y-4">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.05 }}
                className="glass rounded-2xl p-5"
              >
                <p className="text-sm text-neutral-200 mb-1">{entry.note}</p>
                {entry.fileName && <p className="text-xs text-neutral-500 mb-2">file: {entry.fileName}</p>}
                {entry.link && (
                  <p className="text-xs text-neutral-400 break-all">
                    share: <a href={entry.link} className="underline hover:text-white">{entry.link}</a> (copied)
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
