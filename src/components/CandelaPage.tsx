import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CandelaPage() {
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('untitled');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const publishNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    setLink('');
    const blob = new Blob([note], { type: 'text/plain' });
    const file = new File([blob], `${title || 'note'}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: title, cardTitle: title });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'could not publish');
      return;
    }
    if (res.warn) setWarn(res.warn);
    const urls = shareUrls(res.id!);
    setLink(urls.app);
    try { await navigator.clipboard.writeText(urls.app); } catch {}
  };

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    const big = file.size > 40 * 1024 * 1024;
    setWarn(big ? 'large file — may feel slow while uploading. no hard limit.' : '');
    setBusy(true);
    setErr('');
    setLink('');
    const res = await publishLocalFile(file, { caption: 'from candela' });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'upload failed');
      return;
    }
    if (res.warn) setWarn(res.warn);
    const urls = shareUrls(res.id!);
    setLink(urls.app);
    try { await navigator.clipboard.writeText(urls.app); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">candela</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet desk</h1>
          <p className="text-neutral-400 text-sm mb-6">write a note or drop a file. both become shareable links with professional Discord embeds. large files only get a gentle warning.</p>

          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="note title"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/40 transition"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="write something..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/40 transition resize-none"
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={publishNote}
              disabled={busy || !note.trim()}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'publishing…' : 'publish note'}
            </motion.button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <label
              className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            >
              <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
              <p className="text-white font-medium">{busy ? 'sending…' : 'or drop a file here'}</p>
              <p className="text-xs text-neutral-500 mt-1">no size caps. only slow warnings for the heavy ones.</p>
            </label>
          </div>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-white/5">
              <p className="text-xs text-neutral-400 break-all mb-3">share link (copied): {link}</p>
              <button onClick={() => navigate('share', link.split('/').pop())} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">open share</button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
