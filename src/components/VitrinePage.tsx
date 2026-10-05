import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { prettySize, uploadShare } from '../lib/db';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2', '#64D2FF'];

export default function VitrinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'Large drop. The tab may pause while it goes up. Nothing is refused.';
    if (file.size > 20 * 1024 * 1024) return 'Over 20 MB. It still ships, just give the upload a moment.';
    return '';
  }, [file]);

  const previewName = title.trim() || file?.name || 'Untitled drop';
  const previewBody = caption.trim() || 'A file from rankvault. Paste the link in Discord for the card.';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const row = await uploadShare(file, caption.trim() || title.trim(), author.trim());
      const url = `${window.location.origin}/s/${row.id}`;
      setLink(url);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 240) : 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 pt-24 pb-24">
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm mb-3">
          vitrine
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
        >
          Dress the card before you share it.
        </motion.h1>
        <p className="text-neutral-400 max-w-xl mb-10 leading-relaxed">
          Drop a local file, write the line Discord should show, and keep the older desks. No size gate — only a note if the upload might feel slow.
        </p>
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center cursor-pointer hover:border-white/30 transition">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setLink('');
                }}
              />
              <span className="block text-sm text-neutral-200">{file ? file.name : 'Choose a file from this computer'}</span>
              <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'image, clip, doc, archive'}</span>
            </label>
            {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="card title"
              className="mt-4 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="the line under the title"
              rows={3}
              className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name, optional"
              className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60"
            />
            <div className="mt-4 flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  aria-label={c}
                  className="h-7 w-7 rounded-full transition"
                  style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <button
              disabled={!file || busy}
              className="mt-5 w-full rounded-full bg-white text-black text-sm font-medium py-3 disabled:opacity-40 active:scale-[0.99] transition"
            >
              {busy ? 'sending…' : 'put it on the shelf'}
            </button>
            {link && (
              <div className="mt-4 flex gap-2">
                <input readOnly value={link} className="flex-1 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-xs" />
                <button type="button" onClick={copy} className="rounded-full px-4 text-sm bg-white/10">
                  {copied ? 'copied' : 'copy'}
                </button>
              </div>
            )}
          </form>
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] bg-[#1e1f22] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-3">discord preview</p>
            <div className="flex gap-3">
              <div className="w-1 rounded-full" style={{ background: accent }} />
              <div className="min-w-0">
                <p className="text-xs text-neutral-400 mb-1">rankvault</p>
                <p className="text-[15px] font-semibold text-[#00a8fc] truncate">{previewName}</p>
                <p className="text-sm text-neutral-300 mt-1 leading-relaxed">{previewBody}</p>
                <p className="text-xs text-neutral-500 mt-3">{file ? prettySize(file.size) : 'waiting for a file'}</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
