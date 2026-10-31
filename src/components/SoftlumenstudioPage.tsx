import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { prettySize, uploadShare } from '../lib/db';

export default function SoftlumenstudioPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const warn = useMemo(() => {
    if (totalSize > 100 * 1024 * 1024) return 'these are large. the tab may feel slow while uploading. nothing is blocked.';
    if (totalSize > 25 * 1024 * 1024) return 'over 25 MB combined. it will go through, just give it a moment.';
    return '';
  }, [totalSize]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setError('');
    setLinks([]);
    try {
      const results: string[] = [];
      for (const file of files) {
        const row = await uploadShare(file, caption.trim() || title.trim(), author.trim());
        results.push(`${window.location.origin}/s/${row.id}`);
      }
      setLinks(results);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 220) : 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[32px] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.4)]"
        >
          <p className="text-[#0a84ff] text-sm mb-2">softlumenstudio</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">a quiet studio for light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one or many local files with a shared title, caption, and accent light. Soft studio beams gently breathe and settle with spring motion on frosted glass. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center cursor-pointer hover:border-white/30 transition">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              <span className="block text-sm text-neutral-200">
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose files from this computer'}
              </span>
              <span className="block text-xs text-neutral-500 mt-1">
                {files.length ? prettySize(totalSize) : 'anything you can open locally'}
              </span>
            </label>

            {warn && <p className="text-sm text-amber-200/90">{warn}</p>}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="studio title, optional"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name, optional"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="a short caption for the cards"
              rows={3}
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-400">accent</label>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded-full border border-white/10 cursor-pointer"
              />
              <span className="text-xs text-neutral-500">{accent}</span>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            {links.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-300">shared links:</p>
                {links.map((l) => (
                  <p key={l} className="text-xs text-neutral-400 break-all">{l}</p>
                ))}
              </div>
            )}

            <button
              disabled={!files.length || busy}
              className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition"
              style={{ boxShadow: `0 0 40px ${accent}33` }}
            >
              {busy ? 'sending…' : 'share these files'}
            </button>
          </form>

          <motion.div
            className="mt-8 h-1 rounded-full"
            style={{ background: accent }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </main>
    </div>
  );
}
