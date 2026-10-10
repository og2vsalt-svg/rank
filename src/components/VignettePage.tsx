import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { prettySize, uploadShare } from '../lib/db';

export default function VignettePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 100 * 1024 * 1024) return 'very large file. the tab may slow while uploading. nothing is blocked.';
    if (file.size > 30 * 1024 * 1024) return 'over 30 MB. it will go through, just give it time.';
    return '';
  }, [file]);

  function onFile(f: File | null) {
    setFile(f);
    setPreview('');
    if (f && f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  }

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
    <div className="min-h-screen bg-[#050506] text-white mesh">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm mb-3 tracking-wide">vignette</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          A quiet frame for your file.
        </motion.h1>
        <p className="text-neutral-400 mb-10 leading-relaxed text-lg">
          Drop a local file, add a short line, and share the link. Discord will show a clean card. Large files get a gentle warning only.
        </p>

        <form onSubmit={onSubmit} className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.4)] apple-card">
          <label className="block rounded-3xl border border-dashed border-white/15 bg-black/40 px-6 py-12 text-center cursor-pointer hover:border-white/30 transition group">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            {preview ? (
              <motion.img initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} src={preview} alt="" className="mx-auto max-h-48 rounded-2xl object-contain" />
            ) : (
              <>
                <span className="block text-sm text-neutral-200 group-hover:text-white transition">{file ? file.name : 'Choose a file from this device'}</span>
                <span className="block text-xs text-neutral-500 mt-2">{file ? prettySize(file.size) : 'images preview here · anything else is fine'}</span>
              </>
            )}
          </label>

          {warn && <p className="mt-4 text-sm text-amber-200/90">{warn}</p>}

          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="your name, optional"
            className="mt-5 w-full rounded-2xl bg-black/50 border border-white/10 px-4 py-3.5 text-sm outline-none focus:border-[#0a84ff]/70 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="a short line for the Discord card"
            rows={3}
            className="mt-3 w-full rounded-2xl bg-black/50 border border-white/10 px-4 py-3.5 text-sm outline-none focus:border-[#0a84ff]/70 transition"
          />

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {link && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-neutral-300 break-all">
              {link}
            </motion.p>
          )}

          <button
            disabled={!file || busy}
            className="mt-5 w-full rounded-full bg-white text-black py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.985] transition hover:bg-neutral-100"
          >
            {busy ? 'sending…' : 'share vignette'}
          </button>
        </form>
      </main>
    </div>
  );
}
