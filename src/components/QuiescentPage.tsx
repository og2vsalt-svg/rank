import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Share = {
  id: string;
  title?: string;
  caption: string | null;
  name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  accent?: string | null;
  created_at: string;
  warn?: string | null;
  meta?: { title?: string; accent?: string };
};

export default function QuiescentPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/quiescent');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('quiescent is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/quiescent?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a local file');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/quiescent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title, caption, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'quiescent did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/quiescent/${data.id}`;
      setLink(window.location.origin + path);
      navigate('quiescent', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'quiescent did not take it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f5f5f7] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <motion.div
          className="absolute -left-32 -top-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: accent }}
          animate={{ x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-40 bottom-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
          style={{ background: accent }}
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <Navbar />
      <main className="relative max-w-2xl mx-auto px-5 pt-28 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10 text-center"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-white/40 mb-3">quiescent</p>
          <h1 className="text-4xl font-semibold tracking-tight">still water, one file</h1>
          <p className="mt-4 text-neutral-400 text-lg leading-relaxed">
            Drop a local file into quiet glass. Optional title and note. It lands in storage and the public table. Share links open with a clean Discord card. Large files receive only a soft warning of slowness.
          </p>
        </motion.div>

        <motion.form
          onSubmit={leave}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.08 }}
          className="rounded-[32px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl p-7 mb-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="relative rounded-3xl border border-dashed border-white/15 bg-white/[0.02] min-h-[160px] grid place-items-center text-center px-6 py-12 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.035]"
          >
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="font-medium text-lg">{file.name}</p>
                <p className="text-sm text-neutral-500 mt-1">{prettySize(file.size)}</p>
                {file.size > SLOW && <p className="text-xs text-amber-300/70 mt-2">large — may open slowly</p>}
              </div>
            ) : (
              <p className="text-neutral-500">drop a file, or click</p>
            )}
          </div>

          <div className="grid gap-3 mt-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="title"
              className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-white/20 focus:bg-white/[0.06] transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="a short note"
              rows={2}
              className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-white/20 focus:bg-white/[0.06] transition resize-none"
            />
            <div className="flex items-center gap-3 pt-1">
              <label className="text-sm text-neutral-500">accent</label>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-7">
            <motion.button
              type="submit"
              disabled={busy || !file}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-full text-sm font-medium text-black disabled:opacity-40 transition"
              style={{ background: accent }}
            >
              {busy ? 'settling…' : 'leave it still'}
            </motion.button>
            {link && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(link)}
                className="text-sm text-neutral-400 hover:text-white transition"
              >
                copy link
              </button>
            )}
          </div>
          {error && <p className="text-red-400/90 text-sm mt-4">{error}</p>}
          {warn && <p className="text-amber-300/80 text-sm mt-4">{warn}</p>}
        </motion.form>

        <AnimatePresence>
          {focus && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 20 }}
              className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 mb-10"
            >
              <h2 className="text-xl font-medium">{focus.meta?.title || focus.title || focus.name}</h2>
              {focus.caption && <p className="text-neutral-400 mt-2 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(focus.size)} · {focus.mime || 'file'}</p>
              {focus.file_url && (
                <a
                  href={focus.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-4 text-sm hover:underline"
                  style={{ color: focus.meta?.accent || accent }}
                >
                  open
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-2">
          {shares.map((s) => (
            <motion.button
              key={s.id}
              onClick={() => navigate('quiescent', s.id)}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="text-left rounded-2xl bg-white/[0.025] border border-white/[0.06] px-5 py-3.5 hover:bg-white/[0.045] transition"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium truncate">{s.meta?.title || s.title || s.name}</p>
                <p className="text-xs text-neutral-500 shrink-0">{prettySize(s.size)}</p>
              </div>
              {s.caption && <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{s.caption}</p>}
            </motion.button>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
