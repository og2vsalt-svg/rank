import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { prettySize, uploadShare } from '../lib/db';
export default function ShelfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'this one is large. the tab may feel slow while it uploads. nothing is blocked.';
    if (file.size > 20 * 1024 * 1024) return 'over 20 MB. it will go through, just give it a moment.';
    return '';
  }, [file]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const row = await uploadShare(file, caption.trim(), author.trim());
      const url = `${window.location.origin}/s/${row.id}`;
      setLink(url);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 220) : 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm mb-3">shelf</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight mb-3">
          Put a file on the shelf.
        </motion.h1>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          It lands in the shared database and gets a link you can paste in Discord. Older desks stay where they are. There is no size cap, only a note if the upload might drag.
        </p>
        <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center cursor-pointer hover:border-white/30 transition">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="block text-sm text-neutral-200">{file ? file.name : 'Choose a file from this computer'}</span>
            <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'anything you can open locally'}</span>
          </label>
          {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="mt-4 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="a short caption for the card" rows={3} className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {link && <p className="mt-3 text-sm text-neutral-300 break-all">{link}</p>}
          <button disabled={!file || busy} className="mt-4 w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 active:scale-[0.99] transition">
            {busy ? 'sending…' : 'share this file'}
          </button>
        </form>
      </main>
    </div>
  );
}
